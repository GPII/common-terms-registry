/*

This import script is intended to be used with a copy of the previous shared spreadsheet found at:

http://bit.ly/17LIFMB

That file contains records in which the GPII/Cloud4All registry terms are the first set of columns,
and additional namespaces appear on the same rows.

 */

var csvjs = require('./node_modules/csv-json');  // convenience library to handle the CSV import

var argv = require('optimist')
    .usage('Usage: node import.js --url http://couch-db-host:port/db/ --username username --password password --file /path/to/file.csv')
    .demand(['url','username','password','file'])
    .argv;

var url = require('url');
var urlOptions = url.parse(argv.url);

var http = require('http');
if (urlOptions.protocol == 'https:') http = require('https');

http.globalAgent.maxSockets = 20;

var options = { 
    hostname: urlOptions.hostname, 
    port: urlOptions.port, 
    path: urlOptions.path, 
    auth: argv.username + ':' + argv.password,
    method: 'POST', 
    headers: { 'Content-Type': 'application/json'},
    agent: false
};

var namespaces = [
		  'android',
		  'dTV',
		  'easy1',
		  'gnome',
		  'gnomeMagnifier',
		  'gpii',
		  'iso24751',
		  'iso24751W',
		  'mobileAccessCf',
		  'nokiaS40',
		  'nokiaS60',
		  'nvda',
		  'saToGo',
		  'smartHouse',
		  'socialNetworkingApp',
		  'surface',
		  'win7Narrator',
		  'windowsMagnifier',
		  'windowsPhoneInteractionVariable'
		  ];

var gpiiFields = [
		  'defaultValue',
		  'description',
		  'isCertified',
		  'localUniqueId',
		  'notes',
		  'status',
		  'uniqueId'
		  ];

var namespaceSingleFields = [
		       'defaultValue',
		       'description',
		       'userPreference',
		       'valueSpace'
		       ];

var namespaceListFields = [
		       'group',
		       'id'
		       ];



console.log("Starting import from CSV..");
csvjs.parseCsv(argv.file,{},analyzeAndContinue);
console.log("Finished import from CSV..");

function analyzeAndContinue(error,json,stats) {
    if (error) {
	console.log("Error processing CSV file '" + argv.file + "':\n" + error);
	return;
    }

    for (var recordNumber in json) {
	setTimeout(importRow,50 * recordNumber, json[recordNumber]);
    }
}

function importRow(entry) {
    // skip empty rows
    if (entry == null || entry == undefined || entry == {}) {
	console.log("Skipping empty row...");
	return;
    }

    // process the GPII record first

    // TODO:  If we don't have GPII data, create the standard from another entry.
    // For now, throw an error.

    var gpii = {};
    gpii.recordType = 'term';

    gpii.uniqueId = lowerCamelCase(entry['gpii:uniqueId']);
    if (gpii.uniqueId == null || gpii.uniqueId == undefined) {
	gpii.uniqueId = lowerCamelCase(entry['gpii:localUniqueId']);
    }

    if (gpii.uniqueId != null && gpii.uniqueId != undefined) {
	gpii.localUniqueId = lowerCamelCase('gpii:'+entry['gpii:localUniqueId']);

	for (var fieldNumber in gpiiFields) {
	    var field = gpiiFields[fieldNumber];
	    var value = entry['gpii:'+field];
	    if (value != null || value != undefined) {
		gpii[field]=value;
	    }
	}
    }
    else {
	console.log('No unique GPII ID specified in either the gpii:uniqueId or gpii:localUniqueId fields...');
	console.log('Constructing placeholder record from record in first available namespace...');
	
	gpii.status = 'to-review';

	for (var namespaceNumber in namespaces) {
	    var namespace = namespaces[namespaceNumber];
	    var userPreference = entry[namespace+':userPreference'];
	    if (userPreference != null && userPreference != undefined) {
		gpii.uniqueId = lowerCamelCase(userPreference);
		gpii.localUniqueId = "gpii:" + lowerCamelCase(userPreference);

		console.log("Setting provisional uniqueId to: " + gpii.uniqueId);
		console.log("Setting provisional localUniqueId to: " + gpii.localUniqueId);

		var defaultValue = entry[namespace+':defaultValue'];
		if (defaultValue) gpii.defaultValue = defaultValue;
		var description = entry[namespace+':description'];
		if (description) gpii.description = description;
		
		break;
	    }
	}
    }

    if (gpii.uniqueId == null || gpii.uniqueId == undefined) {
	console.log("Unable to construct placeholder GPII record from another namespace.  Skipping record...");
	console.log(entry);
	return;
    }

    uploadEntry(gpii);

    for (var namespaceNumber in namespaces) {
	var namespace = namespaces[namespaceNumber];
	var aliasEntry = {};

	aliasEntry.aliasTranslationOf = gpii.uniqueId;

	// The userPreference field is required and used as the unique identifier for the alias.
	aliasEntry.userPreference = entry[namespace+':userPreference'];

	if (!aliasEntry.userPreference) continue;

	aliasEntry.localUniqueId = namespace + ":" + lowerCamelCase(aliasEntry.userPreference);
	aliasEntry.recordType = 'alias';

	for (var fieldNumber in namespaceSingleFields) {
	    var field = namespaceSingleFields[fieldNumber];
	    var value = entry[namespace+':'+field];
	    if (value != null && value != undefined) {
		aliasEntry[field] = value;
	    }
	}

	var headingAndTitleRegexp = /([0-9\.]+( [a-zA-Z]+)+)/g;
	var headingOnlyRegexp = /([0-9\.]+)/g;

	for (var fieldNumber in namespaceListFields) {
	    var field = namespaceListFields[fieldNumber];
	    var value = entry[namespace+':'+field];
	    if (value == null || value == undefined) continue;

	    // Auto-split lists of terms like '1.2.3.4 honey', with or without title text
	    var headingAndTitleMatches = value.match(headingAndTitleRegexp);
	    var headingMatches = value.match(headingOnlyRegexp);
	    if (headingAndTitleMatches) {
		aliasEntry[field] = headingAndTitleMatches;
	    }
	    else if (headingMatches) {
		aliasEntry[field] = headingMatches;
	    }
	    else {
		aliasEntry[field] = [ value ];
	    }
	}

	uploadEntry(aliasEntry);
    }
}


function uploadEntry(json) {
    var request = http.request(options,confirmResult);
    request.on('error',function(e) { console.log("Error uploading record:" + e.message);});
    request.write(JSON.stringify(json) + '\n');
    request.end();
}

function confirmResult(res) {
    switch(res.statusCode) {
    case 200:
    case 201:
        console.log('Record uploaded successfully...');

        break;
    default: 
        console.log('Error code ' + res.statusCode + ' returned, record was not added...');
    }
}

function lowerCamelCase(originalString) {
    if (originalString == null || originalString == undefined) return originalString;

    var newString = originalString;

    var leadingLetterRegex = /^[ \t]*([A-Za-z])/;
    if (newString.match(leadingLetterRegex)) {
	newString = newString.replace(leadingLetterRegex, function(v) { return v.trim().toLowerCase() });
    }

    var innerSpaceRegex = / +([a-z])/g;

    if (newString.match(innerSpaceRegex)) {
	newString = newString.replace(innerSpaceRegex, function(v) { return v.trim().toUpperCase()});
    }

    return newString;
}
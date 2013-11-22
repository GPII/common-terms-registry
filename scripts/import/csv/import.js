/*

This import script is intended to be used with a copy of the previous shared spreadsheet found at:

http://bit.ly/17LIFMB

That file contains records in which the GPII/Cloud4All registry terms are the first set of columns,
and additional namespaces appear on the same rows.

Before importing, the data needs to be updated to replace the column headings with the contenst of 
the header.txt file included in this directry.

 */

/* jshint -W117 */
var Q = require('q');

var csvjs = require('./node_modules/csv-json');  // convenience library to handle the CSV import

var argv = require('optimist')
    .usage('Usage: node import.js --url http://couch-db-host:port/db/ --username username --password password --file /path/to/file.csv --commit')
    .demand(['url', 'username', 'password', 'file'])
    .describe('url','The URL for your couchdb instance, including database')
    .describe('username','A user who has read and write access to your couch db instance.')
    .describe('password',"The user's password.")
    .describe('file','A CSV file that includes all fields defined in the header.txt file included with the distribution.')
    .describe('commit','By default, no changes will be made.  You must pass this argument to write changes.')
    .argv;

var url = require('url');
var urlOptions = url.parse(argv.url);

var cradle = require('cradle');
var connection = new (cradle.Connection)(url, urlOptions.port, { auth: { username: argv.username, password: argv.password }, cache: true});

var dbName = urlOptions.pathname.replace(/\//g, '');

var db = connection.database(dbName);

var globals = require('../../includes/globals.json');

var preview =  (argv.commit === undefined) ? true : false;

var newRecords = {};

console.log("Starting import from CSV..");
csvjs.parseCsv(argv.file, {}, processCsvData);

function processCsvData(error, json, stats) {
    console.info("Processing CSV JSON data...");
    
    // process each spreadsheet row, then display the stats
    Q.when(importRows(error, json, stats), printStats, showError);
}

function printStats() {
    if (preview) {
        console.log("Running in preview mode, no actual changes have been made.  Run again with --commit to save changes.");
    }
    
    console.log("\n\nStats:\n" + JSON.stringify(stats));
}

/* jshint -W098 */
function importRows(error, json) {
    var q = Q.defer(), rowNumber = 0;
    if (error) {
        q.reject(new Error("Error processing CSV file '" + argv.file + "':\n" + error));
    } else {
        var rowPromises = Q.defer();
        for (rowNumber in json) {
            rowPromises.promise.then(importRow(json[rowNumber]));
        }
        
        q.resolve(rowPromises);
    }
    
    return q.promise;
}

function importRow(entry) {
    var deferred = Q.defer(), gpii = {};
    
    // skip empty rows
    if (entry === null || entry === undefined || entry.toString().trim() === "") {
        console.warn("Skipping empty row...");
        //deferred.reject("Skipping empty row...");
    } else {
        var recordPromise = Q.defer().promise;
        
        // process the GPII record first
        gpii.type = 'GENERAL';
        gpii.source = "gpii";

        var uniqueIdMinusNamespace = lowerCamelCase(entry['gpii:uniqueId']);
        if (uniqueIdMinusNamespace === null || uniqueIdMinusNamespace === undefined) {
            uniqueIdMinusNamespace = lowerCamelCase(entry['gpii:localId']);
        }

        if (uniqueIdMinusNamespace !== null && uniqueIdMinusNamespace !== undefined) {
            gpii.uniqueId = "gpii:" + uniqueIdMinusNamespace;
            gpii.termLabel = entry['gpii:termLabel'];
            
            for (var fieldNumber in globals.gpiiFields) {
                var field = globals.gpiiFields[fieldNumber];
                var value = entry['gpii:'+field];
                if (value !== null || value !== undefined) {
                    gpii[field]=value;
                }
            }
        }
        else {
            console.log('No unique GPII ID specified in either the gpii:uniqueId or gpii:localId fields...');
            console.log('Constructing placeholder record from record in first available namespace...');
            
            for (var namespaceNumber in globals.namespaces) {
                var namespace = globals.namespaces[namespaceNumber];
                var userPreference = entry[namespace+':userPreference'];
                if (userPreference !== null && userPreference !== undefined) {
                    gpii.uniqueId = lowerCamelCase(userPreference);
                    
                    console.log("Setting provisional uniqueId to: " + gpii.uniqueId);
                    
                    var defaultValue = entry[namespace+':defaultValue'];
                    if (defaultValue) {
                        gpii.defaultValue = defaultValue;
                    }
                    
                    var definition = entry[namespace+':definition'];
                    if (definition){
                        gpii.definition = definition;
                    }
                    
                    break;
                }
            }
        }
        
        if (gpii.uniqueId === null || gpii.uniqueId === undefined) {
            var msg = "Unable to construct placeholder GPII record from another namespace.  Original record:\n" + JSON.stringify(entry) + "\nPartial record:" + JSON.stringify(gpii);
            console.log(msg);
            deferred.reject(new Error(msg));
        }
        else {
            // If the record doesn't already exist, upload it now
            recordPromise.then(recordExists(gpii));
            
            for (var namespaceNumber in globals.namespaces) {
                var namespace = globals.namespaces[namespaceNumber];
                var aliasEntry = {};
                
                aliasEntry.type = 'ALIAS';
                
                aliasEntry.aliasOf = gpii.uniqueId;
                
                // The userPreference field is required and used as the label for the alias.
                aliasEntry.termLabel = entry[namespace+':userPreference'];
                
                if (aliasEntry.termLabel === null | aliasEntry.termLabel === undefined) {
                    //console.info("No alias found for namespace " + namespace + " for row:\n" + JSON.stringify(entry)); 
                    continue;
                }
                
                aliasEntry.source   = namespace;
                aliasEntry.uniqueId = aliasEntry.termLabel;
                
                var extraInformation = "";
                
                for (var fieldNumber in globals.namespaceExtraFields) {
                    var field = globals.namespaceExtraFields[fieldNumber];
                    var value = entry[namespace+':'+field];
                    if (value !== null && value !== undefined) {
                        extraInformation += field + ":" + value + "\n";
                    }
                }
                
                if (extraInformation.length > 0) {
                    if (aliasEntry.notes === undefined) { aliasEntry.notes = ""; }
                    aliasEntry.notes += "The original alias record contained the following additional information:\n\n" + extraInformation;
                }
                
                // If the record doesn't exist, upload it
                recordPromise.then(recordExists(aliasEntry));
            }
            
            deferred.resolve(recordPromise);
        }
    }
    
    return deferred.promise;
}

/* jshint -W098 */
function recordExists(entry) {
    var deferred = Q.defer();
    if (!entry || entry === undefined || entry.uniqueId === undefined) {
        console.log("Skipping invalid entry:" + JSON.stringify(entry));
    }
    else {
        console.log("Checking to see if entry '" + entry.uniqueId + "' exists...");

        db.view('trapp/entries', { key: entry.uniqueId }, function (err, doc) {
            if (err) {
                console.error("Error retrieving record using cradle: " + JSON.stringify(err));
                stats.errors++;
            }
            else {
                if (doc.length === 0) {
                    // TODO:  This is currently creating bogus duplicate records
//                    uploadEntry(entry);
                }
                else if (doc.length === 1) {
                    reconcileRecord(doc[0], entry);
                }
                else {
                    console.error("More than one record exists for key '" + entry.uniqueId + "':\n" + JSON.stringify(doc));
                    stats.errors++;
                }
            }
        });

    }
    
    return deferred.promise;
}

function reconcileRecord(originalRecord, importRecord) {
    console.log("\nReconciling record '" + importRecord.uniqueId + "' with existing data...");

    var q = Q(), warnings = [];

    var updatedRecord = JSON.parse(JSON.stringify(originalRecord));

    // we know the uniqueID is the same, compare the rest of the fields and make a note of any differences...
    for (var fieldNumber in globals.gpiiFields) {
        var field = globals.gpiiFields[fieldNumber];
        if (field === "notes") continue;
        
        var originalValue = originalRecord.value[field];
        var importedValue = importRecord[field];
        
        if (originalValue != importedValue) {
            if (importedValue === null || importedValue === undefined) {
//                warnings.push("Spreadsheet missing data for field '" + field + "'.  Retained SAT data.");
            }
            else if (originalValue === null || originalValue === undefined) {
                updatedRecord[field] = importRecord[field];
                warnings.push("Recovered value for field '" + field + "' from spreadsheet.");
            }
            else {
                warnings.push("Found conflicting data for field '" + field + "' in spreadsheet: " + importedValue);
            }
        }
    }    

    if (warnings.length > 0) {
        if (updatedRecord.notes === undefined) { updatedRecord.notes = ""; }
        for (var warningNumber in warnings) {
            var warning = warnings[warningNumber];
            updatedRecord.notes += warning + "\n";
        }
        
        if (preview) {
            console.log("I should have updated the following record: " + JSON.stringify(updatedRecord));
        }
        else {
            db.save(updatedRecord._id, updatedRecord._rev, updatedRecord, function (err, res) { 
                if (err) {
                    console.error("Error updating existing record:" + err.message);
                }
    
                console.log("save response: " + JSON.stringify(res));
            });
        }
    }
    else {
        console.log("No differences found, leaving existing record alone...");
    }
    
    return q.promise;
}


function uploadEntry(json) {
    var deferred = Q.defer();
    
    if (preview) {
        // Skip processing, we are in preview mode
        console.log("I should have uploaded: " + JSON.stringify(json));
        deferred.resolve("Finished processing");
    }
    else {
        console.log("Uploading record '" + json.uniqueId + "'...");
        db.save(json, function (err, res) { 
            if (err) {
                console.error(err.message);
            }

            console.log("save response: " + JSON.stringify(res));
        });
    }
    
    return deferred.promise;
}

function lowerCamelCase(originalString) {
    if (originalString === null || originalString === undefined) { return originalString; }
    
    var newString = originalString;

    newString = newString.replace(/^[ \(\)\-\_]+/,'');
    newString = newString.replace(/[ \(\)\-\_]+$/,'');
    
    var leadingLetterRegex = /^[ \t]*([A-Za-z])/;
    if (newString.match(leadingLetterRegex)) {
        newString = newString.replace(leadingLetterRegex, function(v) { return v.trim().toLowerCase(); });
    }
    
    var innerSpaceRegex = /[ _]+([a-z])/g;
    
    if (newString.match(innerSpaceRegex)) {
        newString = newString.replace(innerSpaceRegex, function(v) { return v.trim().toUpperCase();});
    }
    
    return newString;
}

function showError(err) {
    console.err("ERROR importing from CSV:" + err);
}
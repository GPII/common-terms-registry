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

var csv = require('csv');

var dbName = urlOptions.pathname.replace(/\//g, '');

var db = connection.database(dbName);

var globals = require('../../includes/globals.json');
var headers = require('./headers.json');

var preview =  (argv.commit === undefined) ? true : false;

var rawCsvRecords    = [];
var convertedRecords = {};
var recordsToUpload  = {};

readCsvRecords().then(convertRecords).then(checkRecords).then(uploadRecords);

function readCsvRecords() {
    console.log("Reading CSV records...");
    var q = Q.defer();

    var fs = require('fs');
    csv().from.stream(fs.createReadStream(argv.file))
    .transform( function(row){
        var jsonRecord = {};
        for (var position in headers) {
            var header = headers[position];
            var value = row[position];
            if (value !== undefined && value.trim().length > 0) {
                jsonRecord[header] = value.trim();
            }
        }
        return jsonRecord;
    })
    .on('record', function(row,index) {
        rawCsvRecords.push(row);
    })
    .on('end',function(count) {
        console.log("Imported " + count + " rows from CSV file...");
        q.resolve();
    })
    .on('error',function(error) {
        q.reject(error);
    });
    
    return q.promise;
}

function convertRecords() {
    console.log("Converting " + Object.keys(rawCsvRecords).length + " rows of CSV data to common format...");
    var q = Q.defer();
    
    for (var a = 0; a <  rawCsvRecords.length; a++) {
        var entry = rawCsvRecords[a];    
        var gpii = {};
        gpii.type = 'GENERAL';
        gpii.source = "gpii";

        var uniqueIdMinusNamespace = lowerCamelCase(entry['gpii:uniqueId']);
        if (uniqueIdMinusNamespace === null || uniqueIdMinusNamespace === undefined) {
            uniqueIdMinusNamespace = lowerCamelCase(entry['gpii:localId']);
        }

        if (uniqueIdMinusNamespace !== null && uniqueIdMinusNamespace !== undefined) {
            gpii.uniqueId = uniqueIdMinusNamespace;
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
        }
        else {
            convertedRecords["gpii:" + gpii.uniqueId] = gpii;
            
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
                
                var aliasKey = namespace + ":" + aliasEntry.uniqueId;
                if (convertRecords[aliasKey] !== undefined) {
                    console.log("Merging duplicate aliases for unique ID '" + aliasKey + "'");
                    var combinedRecord = mergeRecords(convertRecords[aliasKey],aliasEntry);
                    convertedRecords[aliasKey]=combinedRecord;
                }
                else {
                    convertedRecords[aliasKey]=aliasEntry;
                }
            }
        }
    }
    
    q.resolve();
    return q.promise;
}

function checkRecords() {
    console.log("Checking " + Object.keys(convertedRecords).length + " converted records against existing data...");
    var q = Q.defer();
    
    var checkPromise = Q.defer();
    for (var a = 0; a < Object.keys(convertedRecords).length; a++) {
            db.view('trapp/entries', { key: entry.uniqueId }, function (err, doc) {
    }
    // Check to see if the record exists, if not, add it to the cache
    
    q.resolve(checkPromise);

    return q.promise;
}


function uploadRecords() {
    console.log("Uploading " + Object.keys(recordsToUpload).length + " new records...");
    var q = Q.defer();
    
    q.resolve();
    return q.promise;
}

function mergeRecords(originalRecord, newRecord) {
    if (newRecord === undefined) {
        console.log("Can't merge an existing record with an empty record.");
        return originalRecord;
    }
    else if (newRecord.uniqueId != originalRecord.uniqueId) {
        console.log("New record does not match the unique ID of the original, can't continue with merge.");
        return originalRecord;
    }
    
    var combinedRecord = JSON.parse(JSON.stringify(originalRecord));
    var warnings = [];
        // we know the uniqueID is the same, compare the rest of the fields and make a note of any differences...
    for (var fieldNumber in globals.gpiiFields) {
        var field = globals.gpiiFields[fieldNumber];
        if (field === "notes") continue;
        
        var originalValue = originalRecord[field];
        var importedValue = importRecord[field];
        
        if (originalValue != importedValue) {
            if (importedValue === null || importedValue === undefined) {
//                warnings.push("New record missing data for field '" + field + "'.  Retained original data.");
            }
            else if (originalValue === null || originalValue === undefined) {
                combinedRecord[field] = importRecord[field];
                warnings.push("Recovered value for field '" + field + "' from spreadsheet.");
            }
            else {
                warnings.push("Found conflicting data for field '" + field + "' in spreadsheet: " + importedValue);
            }
        }
    }    

    if (warnings.length > 0) {
        if (combinedRecord.notes === undefined) { combinedRecord.notes = ""; }
        for (var warningNumber in warnings) {
            var warning = warnings[warningNumber];
            combinedRecord.notes += warning + "\n";
        } 
    }

    return combinedRecord;
}

///* jshint -W098 */
//function recordExists(entry) {
//    var deferred = Q.defer();
//    if (!entry || entry === undefined || entry.uniqueId === undefined) {
//        console.log("Skipping invalid entry:" + JSON.stringify(entry));
//    }
//    else {
//        if(newRecords[entry.uniqueId] !== undefined) {
//            console.log("Entry '" + entry.uniqueId + "' already exists in the cache.  I don't need to check the database.");
//        }
//        else {
//            console.log("Checking to see if entry '" + entry.uniqueId + "' exists in the database...");
//
//            db.view('trapp/entries', { key: entry.uniqueId }, function (err, doc) {
//                if (err) {
//                    console.error("Error retrieving record using cradle: " + JSON.stringify(err));
//                }
//                else {
//                    if (doc.length === 0) {
//                        newRecords[entry.uniqueId] = entry;
//                    }
//                    else if (doc.length === 1) {
//                        reconcileRecord(doc[0], entry);
//                    }
//                    else {
//                        if (entry.type === 'GENERAL') {
//                            console.error("More than one record already exists for term '" + entry.uniqueId + "'.");
//                            
//                            var termFound = false;
//                            for (var a=0; a < doc.length; a++) {
//                                if (doc[a].value.source !== undefined && doc[a].value.source == "gpii") {
//                                    console.log("Found matching term.");
//                                    reconcileRecord(doc[a],entry);
//                                    termFound = true;
//                                }
//                            }
//                            
//                            if (!termFound) {
//                                console.log("No comparable term record already exists, need to create a new record instead...");
//    //                            uploadEntry(entry);
//                            }
//    
//                        }
//                        else if (entry.type == 'ALIAS') {
//                            console.log("More than one record exists with the same unique ID, checking the source instead...");
//                            var aliasFound = false;
//                            for (var a=0; a < doc.length; a++) {
//                                if (entry.aliasOf === doc[a].value.aliasOf && entry.source !== undefined && doc[a].value.source !== undefined && entry.source == doc[a].value.source) {
//                                    console.log("Found matching record for source '" + entry.source + "'.");
//                                    aliasFound = true;
//                                    reconcileRecord(doc[a],entry);
//                                }
//                            }
//                            
//                            if (!aliasFound) {
//                                console.log("These are not aliases of the same parent record, need to create a new record instead...");
//    //                            uploadEntry(entry);
//                            }
//                        }
//                    }
//                }
//            });
//        }
//    }
//    
//    return deferred.promise;
//}
//

function convertCouchRecord(record) { 
    var standardRecord = {};

    for (var fieldNumber in globals.gpiiFields) {
        var field = globals.gpiiFields[fieldNumber];
        var value = record.value[field];
        if (value !== undefined) { 
            standardRecord[field] = value;
        }
    }
    
    return standardRecord;
}

//function uploadEntry(json) {
//    var deferred = Q.defer();
//    
//    if (preview) {
//        // Skip processing, we are in preview mode
//        console.log("I should have uploaded: " + JSON.stringify(json));
//        deferred.resolve("Finished processing");
//    }
//    else {
//        console.log("Uploading record '" + json.uniqueId + "'...");
//        db.save(json, function (err, res) { 
//            if (err) {
//                console.error(err.message);
//            }
//
//            console.log("save response: " + JSON.stringify(res));
//        });
//    }
//    
//    return deferred.promise;
//}

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
/*

This script performs a bulk find and replace with a preview mode.

You must have already imported all data (see the "import" directory for details) and set up the views used by the search (see the "couchapp" directory for details).

 */

/* jshint -W117 */
var Q = require('q');
Q.longStackSupport = true;

var argv = require('optimist')
    .usage('Usage: node find-and-replace.js --url http://[username:password@]couch-db-host:port/db/ --field FIELDNAME --find REGEXP --replace REGEXP --commit')
    .demand(['url', 'field', 'find'])
    .describe('url','The URL for your couchdb instance, including database')
    .describe('field','The field to update.')
    .describe('find','The regular expression to look for.')
    .describe('replace','The pattern to replace matches with.')
    .describe('aliases','Update aliases instead of terms (the default).')
    .describe('commit','By default, no changes will be made.  You must pass this argument to write changes.')
    .argv;

var CouchDB = require( 'promised-couch' ).CouchDB
var db = CouchDB( { base: argv.url } )

var field          = argv.field;
var find_regexp    = new RegExp(argv.find);
var replace_regexp = argv.replace !== undefined ? argv.replace : "";

var globals = require('../../includes/globals.json');

var preview =  (argv.commit === undefined) ? true : false;

var dbRecords       = {};
var recordsToUpdate = {}

var recordType = "GENERAL";
var url = '_design/trapp/_view/terms';

if (argv.aliases) {
    recordType = "ALIASES";
    url = '_design/trapp/_view/aliases';
}

// TODO:  We are only operating on terms for now.  Add filtering by type, etc. and allow all record types.
db.get(url).then(cacheSearchResults, showError).then(matchRecords, showError).then(uploadRecords, showError);

//cacheDbRecords().then(matchRecords).then(uploadRecords);

function cacheSearchResults(content) {
    console.log("Caching search results...");
    var q = Q.defer();

    if (content !== undefined && content.rows.length > 0) {
        for (var position in content.rows) {
            var record = content.rows[position].value;
            var key  = record.source + ":" + record.uniqueId;

            dbRecords[key] = record;
        }

        console.log("Cached " + Object.keys(dbRecords).length + "/" + content.rows.length + " records...");
    }

    q.resolve();
    return q.promise;
}

function matchRecords() {
    console.log("Performing find and replace...");
    var q = Q.defer();

    // iterate through the cached db records in dbRecords
    var keys = Object.keys(dbRecords);
    for (var position in keys) { 
        var key = keys[position];
        var record = dbRecords[key];
        var recordValue = record[field] ? record[field] : "";

        if (recordValue.match(find_regexp)) {
            // clone the original record
            var newRecord = JSON.parse(JSON.stringify(record));

            newRecord[field] = recordValue.replace(find_regexp,replace_regexp);

            // TODO:  Currently we have some invalid data that cannot be safely updated.  For now we have to massage the records manually.
            if (recordType === "GENERAL") {
                if (newRecord.definition === undefined || newRecord.definition.trim().length == 0) {
                    newRecord.definition = "Undefined...";
                }
            }
            // save a replacement version of each matched record to recordsToUpdate[uniqueId]
            recordsToUpdate[key] = newRecord;
        }
    }

    q.resolve();
    return q.promise;
}


function uploadRecords() {
    var q = Q.defer();

    var updatedRecordKeys = Object.keys(recordsToUpdate);
    console.log("Saving " + updatedRecordKeys.length + " updated records...");
    for (var position in updatedRecordKeys) {
        var key = updatedRecordKeys[position];
        var dbRecord = dbRecords[key];
        var updatedRecord = recordsToUpdate[key];

        if (preview) {
            console.log("preview mode, should have changed value of '" +  field + "' from '" + dbRecord[field] + "' to '" + updatedRecord[field] + "' in record '" + key + "'...");
        }
        else {
            // FIXME:  The put method provided by promised-couch doesn't have a fail method and as a result we can't trap validation errors properly.
//            db.put(updatedRecord, showError);

            // As a workaround, just put the update with a traditional callback.  Not very promise-y, but functional.
            var url = require('url');
            var urlOptions = url.parse(argv.url);

            var http = require('http');
            http.globalAgent.maxSockets = 2000;

            var reqOptions = {
                hostname: urlOptions.hostname,
                port:     urlOptions.port,
                path:     urlOptions.path + "/" + updatedRecord._id,
                auth:     urlOptions.auth,
                method:   'PUT',
                headers: { 'Content-Type': 'application/json'},
                agent: false
            };

            var req = http.request(reqOptions, function(res) {
//                console.log('STATUS: ' + res.statusCode);
//                console.log('HEADERS: ' + JSON.stringify(res.headers));
//                res.setEncoding('utf8');
//                res.on('data', function (chunk) {
//                    console.log('BODY: ' + chunk);
//                });
            });

            req.on('error', function(e) {
                console.log('problem with request: ' + e.message);
            });

            req.write(JSON.stringify(updatedRecord) + "\n");
            req.end();
        }
    }

    return q.promise;
}

function showError(error) {
    console.error("Error:" + error);
}
/*

This script performs a bulk find and replace with a preview mode.

You must have already imported all data (see the "import" directory for details) and set up the views used by the search (see the "couchapp" directory for details).

 */
"use strict";

var argv = require('yargs')
    .usage('Usage: node find-and-replace.js --url http://[username:password@]couch-db-host:port/db/ --field FIELDNAME --find REGEXP --replace REGEXP --commit')
    .demand(['url', 'field'])
    .describe('url','The URL for your couchdb instance, including database')
    .describe('field','The field to update.')
    .describe('find','The regular expression to look for.  If this is not specified, we will look for records where the value is undefined.')
    .describe('replace','The pattern to replace matches with.  If this is not specified, matching records will have their value for FIELD cleared.')
    .describe('commit','By default, no changes will be made.  You must pass this argument to write changes.')
    .argv;

var field          = argv.field;
var find_regexp    = argv.find ? new RegExp(argv.find) : "^.*$";
var replace_regexp = argv.replace !== undefined ? argv.replace : "^$";

var globals = require('../../includes/globals.json');

var request = require('request');

var preview =  (argv.commit === undefined) ? true : false;

var matchingRecords = [];

var searchUrl = argv.url + "/_all_docs?include_docs=true";
request.get(searchUrl, function(e,r,b) {

    if (r.body) {
        var jsonData = JSON.parse(r.body);
        if (jsonData.rows) {
            jsonData.rows.forEach(function(row) {
                if (row.id.indexOf("_design") === -1) {
                    var doc = row.doc;
                    if ((!argv.find && ! doc[field]) || (argv.find && doc[field] && find_regexp.test(doc[field]))) {
                        matchingRecords.push(doc);
                    }
                }
            });
        }
    }

    displayMatches();

    if (preview) {
        console.log("running in preview mode, no updates will be performed...");
    }
    else {
        updateRecords();
    }
});

function displayMatches() {
    var condition = argv.find ? "matches '" + argv.find + "'" : "is empty";
    console.log("Found " + matchingRecords.length + " records where '" + field + "' " + condition + "...");
}

function updateRecords() {
    var updatedDocs = [];

    matchingRecords.forEach(function(record) {
        var newRecord = JSON.parse(JSON.stringify(record));
        if (argv.replace) {
            if (!record[field]) {
                newRecord[field] = argv.replace;
            }
            else {
                newRecord[field] = record[field].replace(find_regexp,replace_regexp);
            }
        }
        else {
            delete newRecord[field];
        }
        updatedDocs.push(newRecord);
    });

    var updateOptions = {
      url: argv.url + "/_bulk_docs",
      json: true,
      body: { docs: updatedDocs}
    };

    request.post(updateOptions, function(e, r, b) {
        if (e) { console.error(e); return; }
        debugger;
        if (b)  {
            b.forEach(function(row){
                if (row.reason) {
                   console.error("Error updating record '" + row.reason.current.uniqueId + "':")
                    row.reason.errors.forEach(function(error) {
                        Object.keys(error).forEach(function(field) {
                           console.error("  '" + field + "': " + error[field]);
                        });
                    });
                }
            });
        }
    });
}
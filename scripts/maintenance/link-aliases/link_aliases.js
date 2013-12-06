/*

  This script goes through the list of terms and associates them with their aliases to improve 
  performance in lookups.
  
  You must have imported the required data and set up all views before this script will work correctly.

*/

/* jslint -W117 */
var argv = require('optimist')
    .usage('Usage: node link_aliases.js --url http://couch-db-host:port/db/ --username username --password password --commit')
    .demand(['url', 'username', 'password'])
    .describe('url','The URL for your couchdb instance, including database')
    .describe('username','A user who has read and write access to your couch db instance.')
    .describe('password',"The user's password.")
    .describe('commit','By default, no changes will be made.  You must pass this argument to write changes.')
    .argv;

var url = require('url');
var urlOptions = url.parse(argv.url);

var Q = require('q');

var globals = require('../../includes/globals.json');

var cradle = require('cradle');
var connection = new (cradle.Connection)(url, urlOptions.port, { auth: { username: argv.username, password: argv.password }, cache: true});

var dbName = urlOptions.pathname.replace(/\//g, '');

var db = connection.database(dbName);

var preview =  (argv.commit === undefined) ? true : false;

var aliasesByTermId = {};


scanAliases().then(processAliasSearchResults).then(finishedInitialScan).done(function() { console.log("Done:" + JSON.stringify(aliasesByTermId));});

function scanAliases() {
    console.log("Loading aliases from database...");
    var deferred = Q.defer();

    db.view('trapp/aliases', function(err,doc) { 
        if (err) {
            deferred.reject(new Error(err));
        } else {
            deferred.resolve(doc);
        }        
    });
    
    return deferred.promise;
}

function finishedInitialScan() {
    console.log("Finished initial scan and building aliases...");
    
    console.log("Found " + Object.keys(aliasesByTermId).length + " terms with aliases...");

    for (var key in aliasesByTermId) {
        console.info("Searching for record '" + key + "'...");
        
        // get the record from the database
        db.view('trapp/entries', { key: key }, updateTerm);
    }
}
function updateTerm(err, doc) {
//    console.log("Updating term record...");
    if (err) {
        console.error("Error retrieving record using cradle: " + JSON.stringify(err));
        stats.errors++;
    }
    else {
        if (doc === undefined || doc.length === 0) {
            console.error("Can't add aliases, no record was found...");
        }
        else if (doc.length === 1) {
            // update it with the list of aliases
            // construct a new record
            var termRow = doc[0];
            
            var updatedRow = {};
            updatedRow.key = termRow.key;
            
            for (var field in termRow.value) {
                updatedRow[field]=termRow.value[field];
            }

            // TODO:  There are currently incomplete records that lack required data and as a result cannot be updated.  Remove this once all records are sane.
            if (updatedRow['definition'] === undefined || updatedRow['definition'].trim().length == 0) { updatedRow['definition'] = "Undefined..."; }
            
            updatedRow.aliases = aliasesByTermId[termRow.key];
            
            if (preview) {
                console.log("I should have saved the following record: " + JSON.stringify(updatedRow));
            }
            else {
                db.save(updatedRow._id, updatedRow._rev, updatedRow, saveTerm);
            }
        }
        else {
            console.error("More than one record exists for key '" + doc[0].key + "'...");
        }
    }
}

function saveTerm(err, res) {
    if (err) {
        console.error("Error saving record: " + err.error);
	if (err.reason !== undefined) {
	    if (err.reason.summary !== undefined) {
		console.error("  Summary: " + err.reason.summary);
	    }
	    if (err.reason.errors !== undefined) {
		for (var position in err.reason.errors) {
		    var errorMap = err.reason.errors[position];
		    var keys = Object.keys(errorMap);
		    for (var keyPos in keys) {
			var key = keys[position];
			var value = errorMap[key];
			console.error("    Error saving field '" + key + "':" + value);
		    }
		}
	    }
	}
        return;
    } 
    
    //console.log("Saved alias data to term:" + JSON.stringify(res));
}

function processAliasSearchResults(doc,err) {
    var deferred = Q.defer();

    console.log("Scanning aliases..."); 
    if (err) {
        console.error("ERROR: " + err.error + ":\n" + err.reason);
        return;
    }

    for (var rowNumber in doc) { 
        var row = doc[rowNumber];
        if (aliasesByTermId[row.value.aliasOf] === undefined) { aliasesByTermId[row.value.aliasOf] = []; }
        aliasesByTermId[row.value.aliasOf].push(row);
    }

    deferred.resolve(aliasesByTermId);
    
    return deferred.promise;
}

function showError(err) {
    console.error("ERROR:" + err);
}
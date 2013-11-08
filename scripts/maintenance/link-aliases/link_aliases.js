/*

  This script goes through the list of terms and associates them with their aliases to improve 
  performance in lookups.

*/

var argv = require('optimist')
    .usage('Usage: node link_aliases.js --url http://couch-db-host:port/db/ --username username --password password')
    .demand(['url','username','password'])
    .argv;

var url = require('url');
var urlOptions = url.parse(argv.url);

var http = require('http');
if (urlOptions.protocol == 'https:') http = require('https');

http.globalAgent.maxSockets = 20;

var url = require('url');
var urlOptions = url.parse(argv.url);

var cradle = require('cradle');
var connection = new(cradle.Connection)(url, urlOptions.port, { auth: { username: argv.username, password: argv.password }, cache: true});

var dbName = urlOptions.pathname.replace(/\//g,'');

var db = connection.database(dbName);

var aliasesByTermId = {};
var termsByTermId = {};

db.view('trapp/terms', scanTerms);

var termRowsLeft = 0;
var aliasRowsLeft = 0;

function scanTerms(err,res) {
    if (err) {
	console.error("ERROR: " + err.error + ":\n" + err.reason);
	return;
    }

    termRowsLeft = res.length;
    res.forEach(function(row) { scanTerm(row); if (termRowsLeft-- <= 0) { return; } else console.log(termRowsLeft + " terms left...");});

    setTimeout(waitToFinish,1000);
}

function waitToFinish() {
    if (termRowsLeft > 0 || aliasRowsLeft > 0) {
	console.log("Waiting for all callbacks to finish (" + termRowsLeft + ":" + aliasRowsLeft + "), press Ctrl+C to exit...");
	setTimeout(waitToFinish,1000);
    }
    else {
	finishedInitialScan();
    }
}

function finishedInitialScan() { 
    console.log("Finished initial scan and building aliases..."); 

    //console.log(JSON.stringify(aliasesByTermId));

    console.log("Found " + Object.keys(aliasesByTermId).length + " terms with aliases...");

    for (var key in aliasesByTermId) {
	console.info("Saving record " + key + "...");
	var termRow = termsByTermId[key];
	termRow.aliases = aliasesByTermId[key];
	console.info(JSON.stringify(termRow));
	
	db.save(key,termRow.rev, termRow, saveTerm);
    }
}

function saveTerm(err,res) {
    if (err) {
	console.error(error.error + " " + error.reason);
	return;
    } 

    console.log("Updated aliases...");
}

function scanTerm(termRow) {
    termsByTermId[termRow.id] = termRow;
    db.view('trapp/aliasesByParent', { key: termRow.uniqueId}, function(err,res) {
	    if (err) {
		console.error("ERROR: " + err.error + ":\n" + err.reason);
		return;
	    }

	    aliasRowsLeft += res.length;

	    var aliases = [];
	    res.forEach(function(aliasRow) { 
		    if (aliasesByTermId[termRow.id] == undefined) aliasesByTermId[termRow.id] = [];

		    aliasesByTermId[termRow.id].push(aliasRow.id);
		    aliasRowsLeft--;
		    if (aliasRowsLeft <= 0) {
			return;
		    }
		});
	});

}

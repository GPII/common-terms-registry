/*

This script is meant to be used with an OWL file downloaded from the Semantic Analysis Tool. 

It will parse the RDF format, extract all leaves, and create (or update) records in a couchdb instance.

*/
var argv = require('optimist')
    .usage('Usage: node import.js --url http://couch-db-host:port/db/ --username username --password password --file /path/to/file.csv')
    .demand(['url', 'username', 'password', 'file'])
    .argv;

var rdf = require('rdf');
var fs = require('promised-io/fs.js');

var Q = require('q');
Q.longStackSupport = true;

var body = "";
var graph = {};

function storeContent(result) {
    console.info("Storing content...");

    body = result.toString();
}


function parseRdf() {
    var environment = {}, filter={};

    console.info("Parsing RDF content...");

    // We should be able to use this to filter the list of nodes without writing our own code

    var parser = new rdf.TurtleParser(environment);
    return Q.invoke(parser.parse(body, {}, 'http://foo.bar/', filter, {}));
}

function showResults() {
    console.log("Results:" + graph.toString());
}

function showError(err) {
    console.error("Error:" + err);
}

fs.readFile(argv.file).then(storeContent, showError).then(parseRdf, showError).then(showResults, showError);
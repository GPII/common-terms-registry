// tests for all write methods
"use strict";
var fluid = require("infusion");
//var jqUnit = fluid.require("jqUnit");

var request = require('request');

// Spin up an express instance
var express = require('express');
var http = require('http');
var path = require('path');
//var exphbs  = require('express3-handlebars');
var bodyParser = require('body-parser');

var app = express();

var PouchDB = require('pouchdb');

var loader = require("../../../configs/lib/config-loader");
var config = loader.loadConfig(require("../../../configs/express/test.json"));

var port = config.port || process.env.PORT || 4895;

// manually point at pouch instead of CouchDB
var pouchBaseUrl = "http://localhost:" + port + "/pouch/";
var pouchDbUrl = pouchBaseUrl + "/tr";

config["couch.url"] = pouchDbUrl;

var testUtils = require("../../tests/lib/testUtils")(config);

app.set('port', port);

// Add PouchDB with simulated CouchDb REST endpoints
app.use('/pouch', require('express-pouchdb')(PouchDB));

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// TODO: Add all required views to pouchdb

// TODO:  Wire these callbacks into the test harness

// We have to create the database before we can populate it
function loadPouch() {
    PouchDB.destroy('tr',function(err,info){
        var tr = new PouchDB('tr');

        loadData();
    });
}

// Post the required data once pouch is running
function loadData() {
    var options = {
      "url": pouchDbUrl + "/_bulk_docs",
       "body": JSON.stringify(require("../../tests/data/data.json")),
       "headers": { "Content-Type": "application/json"}
    };
    request.post(options,function(e,r,b) {
        if (e && e !== null) {
            return console.log(e);
        }

        // This needs to be created after the data is populated, apparently (no idea why)
        loadCouchappViews();
    });
}

function loadCouchappViews() {
    var couchappUtils = require("../../tests/lib/couchappUtils")(config);

    var path = __dirname + "/../../../../couchapp/api/";
    var viewContent = couchappUtils.loadCouchappViews(path);

    var options = {
        "url": pouchDbUrl + "/_design/api",
        "body": JSON.stringify(viewContent),
        "headers": { "Content-Type": "application/json"}
    };

    debugger;

    request.put(options,function(e,r,b) {
        if (e && e !== null) {
            return console.log(e);
        }
        debugger;
    });
}

loadPouch();

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

//jqUnit.module("Record API (write)");

// TODO:  Test using PUT to create a new record

// TODO:  Test using PUT to update an existing record

// TODO:  Test using PUT with an invalid record

// TODO:  Test using POST to create a new record

// TODO:  Test using POST with an invalid record

// TODO:  Test using DELETE to delete an existing record

// TODO:  Test versioning on all successful adds and updates

//jqUnit.asyncTest("Retrieve record with the 'children' argument set to false...", function() {
//    // TODO:  This test depends on the existence of a single record.  We should adjust to use test data instead.
//    request.get("http://localhost:" + app.get('port') + "/record/xMPPChatID?children=false", function(error, response, body) {
//        jqUnit.start();
//
//        testUtils.isSaneResponse(jqUnit, error, response, body);
//        var jsonData = JSON.parse(body);
//
//        jqUnit.assertTrue("There should have been a record returned...", jsonData.record);
//        if (jsonData.record) {
//            jqUnit.assertUndefined("Record '" + jsonData.record.uniqueId + "' should not have contained any children", jsonData.record.aliases);
//        }
//    });
//});

//jqUnit.onAllTestsDone.addListener(function() {
//    // Shut down express (seems to happen implicitly, so commented out)
////    http.server.close();
//});
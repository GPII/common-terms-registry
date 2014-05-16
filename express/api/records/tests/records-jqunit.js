"use strict";
var fluid = require("infusion");
var jqUnit = fluid.require("jqUnit");
var request = require('request');

// Spin up an express instance
var express = require('express');
var http = require('http');
var path = require('path');
var testUtils = require("../../tests/lib/testUtils");
//var exphbs  = require('express3-handlebars');
var bodyParser = require('body-parser');

var app = express();
var config = require("../../../configs/express/test.json");

app.set('port', config.port || process.env.PORT || 4895);
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// Mount all variations on the module
var records = require('../../records')(config);
app.use('/records', records);

var termsConfig = JSON.parse(JSON.stringify(config));
termsConfig.recordType = "general";
var terms = require("../../records")(termsConfig);
app.use('/terms', terms);

var aliasConfig = JSON.parse(JSON.stringify(config));
aliasConfig.recordType = "alias";
var aliases = require("../../records")(aliasConfig);
app.use('/aliases', aliases);

var transformConfig = JSON.parse(JSON.stringify(config));
transformConfig.recordType = "transform";
var transforms = require("../../records")(transformConfig);
app.use('/transforms', transforms);

var translationConfig = JSON.parse(JSON.stringify(config));
translationConfig.recordType = "translation";
var translations = require("../../records")(translationConfig);
app.use('/translations', translations);

var operatorsConfig = JSON.parse(JSON.stringify(config));
operatorsConfig.recordType = "operator";
var operators = require("../../records")(operatorsConfig);
app.use('/operators', operators);


http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

jqUnit.module("Records lookup API Tests");

// TODO: We cannot test operators, transforms, or translations until we actually have some stored
// var recordTypeEndPoints = ["terms","aliases","transforms","translations","operators"];

var recordTypeEndPoints = ["terms","aliases"];
var allEndPoints = recordTypeEndPoints.concat(["records"]);

// Test the common functionality of all modules for every end point
jqUnit.asyncTest("Search all endpoints with no arguments", function() {
        allEndPoints.forEach(function(endPoint){
            request.get("http://localhost:" + app.get('port') + "/" + endPoint, function(error, response, body) {
                jqUnit.start();

                testUtils.isSaneResponse(jqUnit, error, response, body);

                jqUnit.assertEquals("The request for endPoint '" + endPoint + "'should have been successful...", response.statusCode, 200);

                var jsonData = JSON.parse(body);
                debugger;
                jqUnit.assertTrue("The total number of rows returned for endPoint '" + endPoint + "' should be greater than zero...", parseInt(jsonData.total_rows) > 0);

                jqUnit.assertNotNull("There should be actual record data returned for endPoint '" + endPoint + "'...", jsonData.records);

                if (jsonData.records) {
                    jqUnit.assertTrue("The record data for endPoint '" + endPoint + "' should have at least one record...", jsonData.records.length > 0);

                    jqUnit.assertTrue("The first record should be sane.", testUtils.isSaneRecord(jsonData.records[0]));
                }
                jqUnit.stop();
            });
        });
    }
);

// TODO:  Test paging

// TODO:  Test limiting by status

// Test that modules other than "records" do not support the recordType option
jqUnit.asyncTest("Search all endpoints with no arguments", function() {
        recordTypeEndPoints.forEach(function(endPoint){
            request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?recordType=general", function(error, response, body) {
                jqUnit.start();

                testUtils.isSaneResponse(jqUnit, error, response, body);

                jqUnit.assertNotEquals("Asking the '" + endPoint + "' end point to return a specific record type should not have been successful...", response.statusCode, 200);

                jqUnit.stop();
            });
        });
    }
);

// TODO:  Test limiting the "records" endpoint  by record type



jqUnit.onAllTestsDone.addListener(function() {
    // Shut down express (seems to happen implicitly, so commented out)
//    http.server.close();
});
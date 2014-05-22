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

jqUnit.module("Records API");

// TODO: We cannot test operators, transforms, or translations until we actually have some stored
// var recordTypeEndPoints = ["terms","aliases","transforms","translations","operators"];

var recordTypeEndPoints = ["terms","aliases"];
var allEndPoints = recordTypeEndPoints.concat(["records"]);

allEndPoints.forEach(function(endPoint){
    jqUnit.asyncTest("Search endpoint '" + endPoint + "' with no arguments", function() {
            request.get("http://localhost:" + app.get('port') + "/" + endPoint, function(error, response, body) {
                jqUnit.start();

                testUtils.isSaneResponse(jqUnit, error, response, body);

                jqUnit.assertEquals("The request for endPoint '" + endPoint + "'should have been successful...", response.statusCode, 200);

                var jsonData = JSON.parse(body);
                jqUnit.assertTrue("The total number of rows returned for endPoint '" + endPoint + "' should be greater than zero...", parseInt(jsonData.total_rows) > 0);

                jqUnit.assertNotNull("There should be actual record data returned for endPoint '" + endPoint + "'...", jsonData.records);

                if (jsonData.records) {
                    jqUnit.assertTrue("The record data for endPoint '" + endPoint + "' should have at least one record...", jsonData.records.length > 0);

                    jqUnit.assertTrue("The first record should be sane.", testUtils.isSaneRecord(jsonData.records[0]));
                }
            });
        });
    }
);

// Test paging by asking for records 1-2 and then records 2-2 and comparing record 2 to itself
recordTypeEndPoints.forEach(function(endPoint){
        jqUnit.asyncTest("Testing paging w/ endpoint '" + endPoint + "' ...", function() {
            var firstRecord, secondRecord;
            request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?offset=0&limit=2", function(error, response, body) {
                jqUnit.start();

                testUtils.isSaneResponse(jqUnit, error, response, body);

                var jsonData = JSON.parse(body);
                jqUnit.assertEquals("The results should include the correct offset...", 0, jsonData.offset);
                jqUnit.assertEquals("The results should include the correct limit...", 2, jsonData.limit);
                jqUnit.assertTrue("The correct number of results should have been returned...", jsonData.records && jsonData.records.length === 2);

                firstRecord = jsonData.records[1];

                jqUnit.stop();

                request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?offset=1&limit=1", function(error, response, body) {
                    jqUnit.start();

                    testUtils.isSaneResponse(jqUnit, error, response, body);

                    var jsonData = JSON.parse(body);
                    jqUnit.assertEquals("The results should include the correct offset...", 1, jsonData.offset);
                    jqUnit.assertEquals("The results should include the correct limit...", 1, jsonData.limit);
                    jqUnit.assertTrue("The correct number of results should have been returned...", jsonData.records && jsonData.records.length === 1);

                    secondRecord = jsonData.records[0];

                    jqUnit.assertDeepEq("The last record in set 0-1 should be the same as the first record in set 1-2...",firstRecord,secondRecord);
                });
            });
        });
    }
);

// Limit by one status, and then limit by two.  There should be more active and deleted records than just active records
recordTypeEndPoints.forEach(function(endPoint){
        jqUnit.asyncTest("Testing filtering by status w/ endpoint '" + endPoint + "' ...", function() {
            var firstRecordCount, secondRecordCount;
            request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?status=active", function(error, response, body) {
                jqUnit.start();

                testUtils.isSaneResponse(jqUnit, error, response, body);

                var jsonData = JSON.parse(body);
                jqUnit.assertDeepEq("The results should include the status filter information passed in the query...", ["active"], jsonData.filters.statuses);

                firstRecordCount = jsonData.records.length;

                jqUnit.stop();

                request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?status=active&status=unreviewed&status=deleted", function(error, response, body) {
                    jqUnit.start();

                    testUtils.isSaneResponse(jqUnit, error, response, body);

                    var jsonData = JSON.parse(body);
                    jqUnit.assertDeepEq("The results should include the status filter information passed in the query...", ["active", "unreviewed", "deleted"], jsonData.filters.statuses);

                    secondRecordCount = jsonData.records.length;

                    jqUnit.assertTrue("There should be more 'active' and 'deleted' records than 'active' records...", firstRecordCount < secondRecordCount);
                });
            });
        });
    }
);

// TODO:  Test limiting the "records" endpoint  by record type(s)

// There should be records updated since the year 2000
recordTypeEndPoints.forEach(function(endPoint){
        jqUnit.asyncTest("Filter endpoint '" + endPoint + "' by future date...", function() {
            request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?updated=2000-01-01", function(error, response, body) {
                jqUnit.start();

                testUtils.isSaneResponse(jqUnit, error, response, body);

                var jsonData = JSON.parse(body);
                jqUnit.assertTrue("The results should include the date filter information passed in the query...", jsonData.filters.updated);
                jqUnit.assertTrue("Limiting records by a date in the past should have returned results...", jsonData.records && jsonData.records.length > 0);
            });
        });
    }
);

// There should be no records updated in the year 3000
recordTypeEndPoints.forEach(function(endPoint){
        jqUnit.asyncTest("Filter endpoint '" + endPoint + "' by future date...", function() {
            request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?updated=3000-01-01", function(error, response, body) {
                jqUnit.start();

                testUtils.isSaneResponse(jqUnit, error, response, body);

                var jsonData = JSON.parse(body);
                jqUnit.assertTrue("The results should include the date filter information passed in the query...", jsonData.filters.updated);
                jqUnit.assertTrue("Limiting records by a far future date should not have returned anything...", jsonData.records && jsonData.records.length === 0);
            });
        });
    }
);


// Test that modules other than "records" do not support the recordType option
recordTypeEndPoints.forEach(function(endPoint){
    jqUnit.asyncTest("Query endpoint '" + endPoint + " with no arguments...", function() {
        jqUnit.start();
            request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?recordType=general", function(error, response, body) {

                testUtils.isSaneResponse(jqUnit, error, response, body);

                jqUnit.assertNotEquals("Asking the '" + endPoint + "' end point to return a specific record type should not have been successful...", response.statusCode, 200);
            });
        });
    }
);

jqUnit.onAllTestsDone.addListener(function() {
    // Shut down express (seems to happen implicitly, so commented out)
//    http.server.close();
});
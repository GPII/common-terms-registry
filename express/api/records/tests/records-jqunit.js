// TODO:  Convert this to use pouchdb and canned data (see "record" for an example of how this is done).
"use strict";
var fluid = require("infusion");
var jqUnit = fluid.require("jqUnit");
var request = require('request');

// Spin up an express instance
var express = require('express');
var http = require('http');
var path = require('path');
//var exphbs  = require('express3-handlebars');
var bodyParser = require('body-parser');

var app = express();

var loader = require("../../../configs/lib/config-loader");
var config = loader.loadConfig(require("../../../configs/express/test.json"));

var testUtils = require("../../tests/lib/testUtils")(config);

app.set('port', config.port || process.env.PORT || 4895);
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// Mount all named variations on the module
var records = require('../../records')(config);
app.use('/records', records);

var termsConfig = JSON.parse(JSON.stringify(config));
termsConfig.recordType = "term";
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
operatorsConfig.recordType = "condition";
var operators = require("../../records")(operatorsConfig);
app.use('/conditions', operators);


http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

jqUnit.module("Records API");

// TODO: We cannot test operators, transforms, or translations until we actually have some stored
// var recordTypeEndPoints = ["terms","aliases","transforms","translations","operators"];

var recordTypeEndPoints = ["terms","aliases"];
var allEndPoints = recordTypeEndPoints.concat(["records"]);

var recordTypesByEndpoint = {"terms": "term", "aliases": "alias", "conditions": "condition", "transforms": "transform", "translations": "translation"};

allEndPoints.forEach(function(endPoint){
    jqUnit.asyncTest("Load endpoint '" + endPoint + "' with no arguments", function() {
            request.get("http://localhost:" + app.get('port') + "/" + endPoint, function(error, response, body) {
                jqUnit.start();

                testUtils.isSaneResponse(jqUnit, error, response, body);

                jqUnit.assertEquals("The request for endPoint '" + endPoint + "'should have been successful...", response.statusCode, 200);

                var jsonData = JSON.parse(body);
                jqUnit.assertTrue("The total number of rows returned for endPoint '" + endPoint + "' should be greater than zero...", parseInt(jsonData.total_rows) > 0);

                jqUnit.assertNotNull("There should be actual record data returned for endPoint '" + endPoint + "'...", jsonData.records);

                if (jsonData.records) {
                    jqUnit.assertTrue("The record data for endPoint '" + endPoint + "' should have at least one record...", jsonData.records.length > 0);

                    testUtils.isSaneRecord(jqUnit, jsonData.records[0]);
                }
            });
        });
    }
);

// Make sure that "total_rows" is meaningful
allEndPoints.forEach(function(endPoint){
        jqUnit.asyncTest("Sanity check total_rows for endpoint '" + endPoint + "'...", function() {
            request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?limit=-1", function(error, response, body) {
                jqUnit.start();

                testUtils.isSaneResponse(jqUnit, error, response, body);

                jqUnit.assertEquals("The request for endPoint '" + endPoint + "'should have been successful...", response.statusCode, 200);

                var jsonData = JSON.parse(body);

                jqUnit.assertNotNull("There should be actual record data returned for endPoint '" + endPoint + "'...", jsonData.records);

                if (jsonData.records) {
                    jqUnit.assertEquals("The record data for endPoint '" + endPoint + "' should have total_rows records...", jsonData.records.length, jsonData.total_rows);

                    testUtils.isSaneRecord(jqUnit, jsonData.records[0]);
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

// Test sorting (all record types)
recordTypeEndPoints.forEach(function(endPoint){
    jqUnit.asyncTest("Testing sorting for " + endPoint + " records...", function() {
            request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?&sort=termLabel",function(error, response, body) {

                jqUnit.start();
                testUtils.isSaneResponse(jqUnit, error, response, body);
                jqUnit.stop();

                var firstRecord = JSON.parse(body).records[0];

                request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?sort=%5CtermLabel",function(error, response, body) {
                    jqUnit.start();
                    testUtils.isSaneResponse(jqUnit, error, response, body);

                    var secondRecord = JSON.parse(body).records[0];
                    jqUnit.assertDeepNeq("The first record when sorting A-Z should not be equal to the first record when sorting Z-A...", firstRecord, secondRecord);
                });
            });
        }
    );
});

// Test sorting (terms, with children)
jqUnit.asyncTest("Testing term sorting, with children", function() {
        request.get("http://localhost:" + app.get('port') + "/terms?sort=termLabel",function(error, response, body) {

            jqUnit.start();
            testUtils.isSaneResponse(jqUnit, error, response, body);
            jqUnit.stop();

            var firstRecord = JSON.parse(body).records[0];

            request.get("http://localhost:" + app.get('port') + "/terms?sort=%5CtermLabel",function(error, response, body) {
                jqUnit.start();
                testUtils.isSaneResponse(jqUnit, error, response, body);

                var secondRecord = JSON.parse(body).records[0];
                jqUnit.assertDeepNeq("The first record when sorting A-Z should not be equal to the first record when sorting Z-A...", firstRecord, secondRecord);
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
                jqUnit.assertDeepEq("The results should include the status filter information passed in the query...", ["active"], jsonData.params.statuses);

                firstRecordCount = jsonData.records.length;

                jqUnit.stop();

                request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?status=active&status=unreviewed&status=deleted", function(error, response, body) {
                    jqUnit.start();

                    testUtils.isSaneResponse(jqUnit, error, response, body);

                    var jsonData = JSON.parse(body);
                    jqUnit.assertDeepEq("The results should include the status filter information passed in the query...", ["active", "unreviewed", "deleted"], jsonData.params.statuses);

                    secondRecordCount = jsonData.records.length;

                    jqUnit.assertTrue("There should be more 'active' and 'deleted' records than 'active' records...", firstRecordCount < secondRecordCount);
                });
            });
        });
    }
);

// There should be records updated since the year 2000
recordTypeEndPoints.forEach(function(endPoint){
        jqUnit.asyncTest("Filter endpoint '" + endPoint + "' by future date...", function() {
            request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?updated=2000-01-01", function(error, response, body) {
                jqUnit.start();

                testUtils.isSaneResponse(jqUnit, error, response, body);

                var jsonData = JSON.parse(body);
                jqUnit.assertTrue("The results should include the date filter information passed in the query...", jsonData.params.updated);
                jqUnit.assertTrue("Limiting records by a date in the past should have returned results...", jsonData.records && jsonData.records.length > 0);
            });
        });
    }
);

// Confirm that /api/records?recordType=term returns the same number of records as /api/terms
recordTypeEndPoints.forEach(function(endPoint) {
    var recordType = recordTypesByEndpoint[endPoint];
    jqUnit.asyncTest("Testing endpoint '" + endPoint + "' versus records?recordType=" + recordType + "...", function() {
        var firstRecordCount, secondRecordCount, firstTotalRows, secondTotalRows;
        request.get("http://localhost:" + app.get('port') + "/records?recordType=" + recordType, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);

            var jsonData = JSON.parse(body);
            firstRecordCount = jsonData.records ? jsonData.records.length : 0;
            firstTotalRows = jsonData.total_rows;

            jqUnit.stop();

            request.get("http://localhost:" + app.get('port') + "/" + endPoint, function(error, response, body) {
                jqUnit.start();

                testUtils.isSaneResponse(jqUnit, error, response, body);

                var jsonData = JSON.parse(body);
                secondRecordCount = jsonData.records ? jsonData.records.length : 0;
                secondTotalRows = jsonData.total_rows;

                jqUnit.assertEquals("There should be the same number of records returned for both records?recordType=" + recordType + " and /api/" + endPoint + "...", firstRecordCount, secondRecordCount);

                jqUnit.assertEquals("total_rows should be the same for both records?recordType=" + recordType + " and /api/" + endPoint + "...", firstTotalRows, secondTotalRows);
            });
        });
    });
});

// Confirm that the same number of terms are returned with and without the "children" option
jqUnit.asyncTest("Testing terms with and without children...", function() {
    var firstRecordCount, secondRecordCount, firstTotalRows, secondTotalRows;
    request.get("http://localhost:" + app.get('port') + "/terms", function(error, response, body) {
        jqUnit.start();

        testUtils.isSaneResponse(jqUnit, error, response, body);

        var jsonData = JSON.parse(body);
        firstRecordCount = jsonData.records ? jsonData.records.length : 0;
        firstTotalRows = jsonData.total_rows;

        jqUnit.stop();

        request.get("http://localhost:" + app.get('port') + "/terms?children=true" , function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);

            var jsonData = JSON.parse(body);
            secondRecordCount = jsonData.records ? jsonData.records.length : 0;
            secondTotalRows = jsonData.total_rows;

            jqUnit.assertEquals("There should be the same number of records returned with and without children...", firstRecordCount, secondRecordCount);

            jqUnit.assertEquals("There should be the same total_rows returned with and without children......", firstTotalRows, secondTotalRows);
        });
    });
});

// There should be no records updated in the year 3000
recordTypeEndPoints.forEach(function(endPoint){
        jqUnit.asyncTest("Filter endpoint '" + endPoint + "' by future date...", function() {
            request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?updated=3000-01-01", function(error, response, body) {
                jqUnit.start();

                testUtils.isSaneResponse(jqUnit, error, response, body);

                var jsonData = JSON.parse(body);
                jqUnit.assertTrue("The results should include the date filter information passed in the query...", jsonData.params.updated);
                jqUnit.assertTrue("Limiting records by a far future date should not have returned anything...", jsonData.records && jsonData.records.length === 0);
            });
        });
    }
);

// When using the children option, "updated" should also be respected
jqUnit.asyncTest("Terms with children, limited by future date...", function() {
    request.get("http://localhost:" + app.get('port') + "/terms?children=true&updated=3000-01-01", function(error, response, body) {
        jqUnit.start();

        testUtils.isSaneResponse(jqUnit, error, response, body);

        var jsonData = JSON.parse(body);
        jqUnit.assertTrue("The results should include the date filter information passed in the query...", jsonData.params.updated);
        jqUnit.assertTrue("Limiting records by a far future date should not have returned anything...", jsonData.records && jsonData.records.length === 0);
    });
});

// When using the children option, the "status" field should work correctly
config.allowedStatuses.forEach(function(status){
    jqUnit.asyncTest("Terms w/ children, limited by status '" + status + "'...", function() {
        request.get("http://localhost:" + app.get('port') + "/terms?children=true&status=" + status, function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);

            var jsonData = JSON.parse(body);
            jqUnit.assertEquals("The results should include the status filter information passed in the query...", status, jsonData.params.statuses[0]);
            if (jsonData.records) {
                jsonData.records.forEach(function(record){
                    jqUnit.assertEquals("All records should have the requested status...", status, record.status);
                });
            }
        });

    });
});


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

// TODO:  Test "versions" functionality

// The output from "terms" and "records" should not include children with the "children" option set to false
["records","terms"].forEach(function(endPoint){
        jqUnit.asyncTest("Query endpoint '" + endPoint + " with the 'children' argument set to false...", function() {
            request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?children=false", function(error, response, body) {
                jqUnit.start();

                testUtils.isSaneResponse(jqUnit, error, response, body);
                var jsonData = JSON.parse(body);

                jqUnit.assertTrue("There should have been records returned...", jsonData.records);
                if (jsonData.records) {
                    jsonData.records.forEach(function(record) {
                        jqUnit.assertUndefined("Record '" + record.uniqueId + "' should not have contained any children", record.aliases);
                    });
                }
            });
        });
    }
);

// The output from "terms" and "records" should include children when the "children" option is set to true
["records","terms"].forEach(function(endPoint){
        jqUnit.asyncTest("Query endpoint '" + endPoint + " with the 'children' argument set to true...", function() {
            request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?children=true", function(error, response, body) {
                jqUnit.start();

                testUtils.isSaneResponse(jqUnit, error, response, body);
                var jsonData = JSON.parse(body);

                jqUnit.assertTrue("There should have been records returned...", jsonData.records);
                if (jsonData.records) {
                    var aliasesFound = false;
                    jsonData.records.forEach(function(record) {
                        if (record.aliases) { aliasesFound = true; }
                    });

                    jqUnit.assertTrue("There should have been at least one record with 'aliases' data...",aliasesFound);
                }
            });
        });
    }
);

// Test that modules other than "records" and "terms" do not support the "children" option
recordTypeEndPoints.forEach(function(endPoint){
        // skip "terms", which should support "children"
        if (endPoint !== "terms") {
            jqUnit.asyncTest("Query endpoint '" + endPoint + " with the 'children' argument set to true (should complain)...", function() {
                request.get("http://localhost:" + app.get('port') + "/" + endPoint + "?children=true", function(error, response, body) {
                    jqUnit.start();

                    testUtils.isSaneResponse(jqUnit, error, response, body);

                    jqUnit.assertNotEquals("Asking the '" + endPoint + "' end point to return children should not have been successful...", response.statusCode, 200);
                });
            });
        }
    }
);


jqUnit.onAllTestsDone.addListener(function() {
    // Shut down express (seems to happen implicitly, so commented out)
//    http.server.close();
});
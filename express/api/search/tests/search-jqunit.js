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
var config = require("../../../configs/express/test.json");
app.set('port', config.port || process.env.PORT || 4895);
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());


// Mount the module in "search" mode
var search = require('../../search')(config);
app.use('/search', search);

// Mount another instance of the module in "suggest" mode
var suggestConfig = JSON.parse(JSON.stringify(config));
suggestConfig.lookup = true;
var suggest = require('../../search')(suggestConfig);
app.use('/suggest', suggest);


http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

jqUnit.module("Search API Tests");

// Search for something that should return results
jqUnit.asyncTest("Search with results", function() {
        request.get("http://localhost:" + app.get('port') + "/search?q=braille",function(error, response, body) {
            jqUnit.start();

            isSaneResponse(error, response, body);

            jqUnit.assertEquals("The request should have been successful...", response.statusCode, 200);

            var jsonData = JSON.parse(body);
            jqUnit.assertTrue("There should be at least one result returned according to the total number of rows..", parseInt(jsonData.total_rows) > 0);

            jqUnit.assertNotNull("There should be actual record data returned...", jsonData.records);
            jqUnit.assertTrue("The record data should have at least one record...", Object.keys(jsonData.records).length > 0);

            jqUnit.assertTrue("The first record should be sane.", isSaneRecord(jsonData.records[0]));
        });
    }
);

// Test searching for something that should not return results  http://localhost:4895/search/?q=flibbertygibbit
jqUnit.asyncTest("Search with no results", function() {
        request.get("http://localhost:" + app.get('port') + "/search?q=flibbertygibbit",function(error, response, body) {
            jqUnit.start();

            isSaneResponse(error, response, body);

            jqUnit.assertEquals("The request should have been successful...", response.statusCode, 200);

            var jsonData = JSON.parse(body);
            jqUnit.assertTrue("There should be no results, but there are " + jsonData.total_rows + "...", parseInt(jsonData.total_rows) === 0);

            jqUnit.assertNotNull("There should be actual record data returned...",jsonData.records);
            jqUnit.assertTrue("The record data should not have any records, but it has " + Object.keys(jsonData.records).length + "...", Object.keys(jsonData.records).length === 0);
        });
    }
);

// Test paging by retrieving records 1-2, reading record 2, then retrieving records 2-2, and comparing what should be the same record (2)
jqUnit.asyncTest("Paging through search results", function() {
        request.get("http://localhost:" + app.get('port') + "/search?q=braille&offset=0&limit=2",function(error, response, body) {

            jqUnit.start();
            isSaneResponse(error, response, body);
            jqUnit.assertTrue("The record data should have the same number of records as the limit...", Object.keys(JSON.parse(body).records).length === 2);
            jqUnit.stop();

            var firstRecord = JSON.parse(body).records[1];

            request.get("http://localhost:" + app.get('port') + "/search?q=braille&offset=1&limit=1",function(error, response, body) {
                jqUnit.start();
                isSaneResponse(error, response, body);
                jqUnit.assertTrue("The record data should have the same number of records as the limit...", Object.keys(JSON.parse(body).records).length === 1);

                var secondRecord = JSON.parse(body).records[0];
                jqUnit.assertDeepEq("The record at the end of the first page should be equal to the record at the end of the second page", firstRecord, secondRecord);
            });
        });
    }
);

// Test sorting by running the same search with reverse sort order and confirming that the first record is not the same
jqUnit.asyncTest("Testing basic sorting", function() {
        request.get("http://localhost:" + app.get('port') + "/search?q=braille&sort=termLabel",function(error, response, body) {

            jqUnit.start();
            isSaneResponse(error, response, body);
            jqUnit.stop();

            var firstRecord = JSON.parse(body).records[0];

            request.get("http://localhost:" + app.get('port') + "/search?q=braille&sort=%5CtermLabel",function(error, response, body) {
                jqUnit.start();
                isSaneResponse(error, response, body);

                var secondRecord = JSON.parse(body).records[0];
                jqUnit.assertDeepNeq("The first record when sorting A-Z should not be equal to the first record when sorting Z-A...", firstRecord, secondRecord);
            });
        });
    }
);

// Test multiple sort parameters with backslashes (encoding problem)
jqUnit.asyncTest("Testing sorting by multiple fields", function() {
        request.get("http://localhost:" + app.get('port') + "/search?q=braille&sort=%5ctermLabel&sort=%5cuniqueId",function(error, response, body) {

            jqUnit.start();
            isSaneResponse(error, response, body);
            var jsonBody = JSON.parse(body);
            jqUnit.assertNotNull("There should be sort parameters returned in the results...",jsonBody.sort);

            jqUnit.assertDeepEq("The sort arguments should be returned in order and JSON-escaped...",["\\termLabel","\\uniqueId"],jsonBody.sort);
        });
    }
);

// Test searching qualified to a single field
jqUnit.asyncTest("Testing qualifying a search to a particular field", function() {
        request.get("http://localhost:" + app.get('port') + "/search?q=highlight",function(error, response, body) {

            jqUnit.start();
            isSaneResponse(error, response, body);
            jqUnit.stop();

            var unqualifiedTotalResults = Object.keys(JSON.parse(body).records).length;
            request.get("http://localhost:" + app.get('port') + "/search?q=termLabel:highlight",function(error, response, body) {
                jqUnit.start();
                isSaneResponse(error, response, body);

                var records = JSON.parse(body).records;
                var qualifiedTotalResults = Object.keys(records).length;
                jqUnit.assertTrue("Searches for 'field:value' should contain less results than searches for 'value'...", qualifiedTotalResults < unqualifiedTotalResults);

                // Make sure that every record either contains the search term in the qualified field, or that one of its aliases does
                records.forEach(function(record){
                    var matchesSearch = false;

                    if (record.termLabel && record.termLabel.toLowerCase().indexOf("highlight") !== -1) {
                        matchesSearch = true;
                    }
                    else {
                        // search the aliases instead
                        if (record.aliases) {
                            record.aliases.forEach(function(alias) {
                                if (alias.termLabel && alias.termLabel.toLowerCase().indexOf("highlight") !== -1) {
                                    matchesSearch = true;
                                }
                            });
                        }
                    }

                    jqUnit.assertTrue("The search term should have been found in the specified field in either the parent term or one of its children",matchesSearch);
                });
            });
        });
    }
);


// Test omitting data for search
jqUnit.asyncTest("Search with no search data", function() {
        request.get("http://localhost:" + app.get('port') + "/search",function(error, response, body) {
            jqUnit.start();
            jqUnit.assertNotEquals("The request should not have been successful...", response.statusCode, 200);

            isSaneResponse(error, response, body);

            var jsonData = JSON.parse(body);

            jqUnit.assertFalse("The 'ok' variable should be set to false", jsonData.ok);
            jqUnit.assertNotNull("A message should be returned",jsonData.message);

            jqUnit.assertNull("There should be no actual record data returned...",jsonData.records);
        });
    }
);


// Confirm that suggest and search return the same data for the same query
jqUnit.asyncTest("Comparing auto-suggest and search results", function() {
        request.get("http://localhost:" + app.get('port') + "/search?q=color",function(error, response, body) {

            jqUnit.start();
            isSaneResponse(error, response, body);
            jqUnit.stop();

            var searchRecord = JSON.parse(body).records[0];

            request.get("http://localhost:" + app.get('port') + "/suggest?q=color",function(error, response, body) {
                jqUnit.start();
                isSaneResponse(error, response, body);

                var suggestRecord = JSON.parse(body).records[0];
                jqUnit.assertDeepEq("The first result for a search and auto-suggest using the same term should be the same record.", searchRecord, suggestRecord);
            });
        });
    }
);

// Test omitting data for suggest
jqUnit.asyncTest("Use auto-suggest with no query data", function() {
        request.get("http://localhost:" + app.get('port') + "/suggest",function(error, response, body) {
            jqUnit.start();
            jqUnit.assertNotEquals("The request should not have been successful...", response.statusCode, 200);

            isSaneResponse(error, response, body);

            var jsonData = JSON.parse(body);

            jqUnit.assertFalse("The 'ok' variable should be set to false", jsonData.ok);
            jqUnit.assertNotNull("A message should be returned",jsonData.message);

            jqUnit.assertNull("There should be no actual record data returned...",jsonData.records);
        });
    }
);


// Test sending paging information to suggest
jqUnit.asyncTest("Pass illegal paging parameters to auto-suggest", function() {
        jqUnit.start();
        function checkIllegalParamResponse(error, response, body) {
            jqUnit.assertNotEquals("The request should not have been successful...", response.statusCode, 200);

            isSaneResponse(error, response, body);

            var jsonData = JSON.parse(body);

            jqUnit.assertFalse("The 'ok' variable should be set to false", jsonData.ok);
            jqUnit.assertNotNull("A message should be returned",jsonData.message);

            jqUnit.assertNull("There should be no actual record data returned...",jsonData.records);
        }

        request.get("http://localhost:" + app.get('port') + "/suggest?q=braille&offset=0", checkIllegalParamResponse);
        request.get("http://localhost:" + app.get('port') + "/suggest?q=braille&limit=10", checkIllegalParamResponse);
        request.get("http://localhost:" + app.get('port') + "/suggest?q=braille&offset=0&limit=10", checkIllegalParamResponse);
    }
);

jqUnit.onAllTestsDone.addListener(function() {
    // Shut down express (seems to happen implicitly, so commented out)
//    http.server.close();
});

// Utility functions for common sanity checks

function isSaneRecord(record) {
    if (!record) { return false; }

    var requiredFields = ["uniqueId","type","status"];
    requiredFields.forEach(function(field) {
        if (!record[field]) {
            return false;
        }
    });

    return true;
}

function isSaneResponse(error, response, body) {
    jqUnit.assertNull("No errors should be returned...",error);
    jqUnit.assertNotNull("A response should be returned...",response);
    jqUnit.assertNotNull("The request should include a return code...", response.statusCode);
    jqUnit.assertNotNull("A body should be returned...", body);

    var jsonData = JSON.parse(body);
    jqUnit.assertNotNull("The 'ok' variable should always be set...", jsonData.ok);
}
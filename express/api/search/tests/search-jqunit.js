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

// Search for something that should return results
jqUnit.module("Search API Tests");

jqUnit.asyncTest("Search with results", function() {
        request.get("http://localhost:" + app.get('port') + "/search?q=braille",function(error, response, body) {
            jqUnit.start();
            jqUnit.assertNull("No errors should be returned...",error);

            jqUnit.assertNotNull("A response should be returned...",response);
            jqUnit.assertEquals("The request should have been successful...", response.statusCode, 200);

            jqUnit.assertNotNull("A body should be returned...", body);

            var jsonData = JSON.parse(body);
            console.log(jsonData.total_rows);
            jqUnit.assertTrue("There should be at least one result returned according to the total number of rows..", parseInt(jsonData.total_rows) > 0);

            jqUnit.assertNotNull("There should be actual record data returned...",jsonData.records);
            jqUnit.assertTrue("The record data should have at least one record...",jsonData.records.length > 0);
            jqUnit.assertTrue("The first record should be sane.", isSane(jsonData.records[0]));
        });
    }
);

// TODO: Test searching for something that should not return results  http://localhost:4895/search/?q=flibbertygibbit

// TODO: Test paging

// TODO: Test sorting

// TODO: Test omitting data for search

// TODO: Test sending invalid data to search

// TODO: Test omitting data for suggest

// TODO: Test sending paging information to suggest


jqUnit.onAllTestsDone.addListener(function() {
    // Shut down express
//    http.server.close();
});

function isSane(record) {
    if (!record) { return false; }

    var requiredFields = ["uniqueId","type","status"];
    requiredFields.forEach(function(field) {
        if (!record[field]) return false;
    });

    return true;
}

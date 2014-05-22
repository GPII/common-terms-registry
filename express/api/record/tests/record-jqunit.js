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
var record = require('../../record')(config);
app.use('/record', record);

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

jqUnit.module("Record API");

jqUnit.asyncTest("Test retrieving record by its uniqueID", function() {
    request.get("http://localhost:" + app.get('port') + "/record/org.gnome.settings-daemon.peripherals.wacom.stylus.pressurecurve", function(error, response, body) {
        jqUnit.start();

        testUtils.isSaneResponse(jqUnit, error, response, body);

        jqUnit.assertEquals("The request should have been successful...", 200, response.statusCode);

        var jsonData = JSON.parse(body);

        jqUnit.assertNotNull("There should be record data returned...", jsonData.record);

        if (jsonData.record) {
            jqUnit.assertTrue("The record returned should be sane...",testUtils.isSaneRecord(jsonData.record));
        }
    });
});

jqUnit.asyncTest("Test retrieving a record that does not exist", function() {
    request.get("http://localhost:" + app.get('port') + "/record/totallyBogusFlibbertyGibbit", function(error, response, body) {
        jqUnit.start();

        testUtils.isSaneResponse(jqUnit, error, response, body);

        jqUnit.assertEquals("The request should returned a 404 (not found)...", 404, response.statusCode);

        var jsonData = JSON.parse(body);

        jqUnit.assertNull("There should not be record data returned...", jsonData.record);
    });
});

jqUnit.asyncTest("Test retrieving a record that does not exist", function() {
    request.get("http://localhost:" + app.get('port') + "/record/", function(error, response, body) {
        jqUnit.start();

        testUtils.isSaneResponse(jqUnit, error, response, body);

        jqUnit.assertNotEquals("The request should not be successful...", 200, response.statusCode);

        var jsonData = JSON.parse(body);

        jqUnit.assertNull("There should not be record data returned...", jsonData.record);
    });
});

jqUnit.onAllTestsDone.addListener(function() {
    // Shut down express (seems to happen implicitly, so commented out)
//    http.server.close();
});
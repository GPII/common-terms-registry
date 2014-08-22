// tests for all read methods
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ctr.record.tests.read";
var read = fluid.registerNamespace(namespace);

var loader = require("../../../configs/lib/config-loader");
read.config = loader.loadConfig(require("../../../configs/express/test-pouch.json"));

var testUtils = require("../../tests/lib/testUtils")(read.config);

read.loadPouch = function() {
    read.pouch = require('../../tests/lib/pouch')(read.config);

    read.pouch.start(function() {
        read.startExpress();
    });
};

// Spin up an express instance
read.startExpress = function() {
    read.express = require('../../tests/lib/express')(read.config);

    read.express.start(function() {

        // Mount all variations on the module
        var record = require('../../record')(read.config);
        read.express.app.use('/record', record);

        read.runTests();
        // Give express-pouch a few seconds to start up
//        setTimeout(read.loadData, 500);
    });
};

read.runTests = function() {
    var jqUnit = fluid.require("jqUnit");
    var request = require('request');
    jqUnit.module("Record API (read)");

    jqUnit.asyncTest("Test retrieving record by its uniqueID", function() {
        request.get("http://localhost:" + read.config.port + "/record/org.gnome.settings-daemon.peripherals.wacom.stylus.pressurecurve", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);

            jqUnit.assertEquals("The request should have been successful...", 200, response.statusCode);

            var jsonData = JSON.parse(body);

            jqUnit.assertNotNull("There should be record data returned...", jsonData.record);

            if (jsonData.record) {
                testUtils.isSaneRecord(jqUnit, jsonData.record);
            }
        });
    });

    jqUnit.asyncTest("Test retrieving a record that does not exist", function() {
        request.get("http://localhost:" + read.config.port + "/record/totallyBogusFlibbertyGibbit", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);

            jqUnit.assertEquals("The request should returned a 404 (not found)...", 404, response.statusCode);

            var jsonData = JSON.parse(body);

            jqUnit.assertNull("There should not be record data returned...", jsonData.record);
        });
    });

    jqUnit.asyncTest("Test retrieving a record that does not exist", function() {
        request.get("http://localhost:" + read.config.port + "/record/", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);

            jqUnit.assertNotEquals("The request should not be successful...", 200, response.statusCode);

            var jsonData = JSON.parse(body);

            jqUnit.assertNull("There should not be record data returned...", jsonData.record);
        });
    });

// TODO:  Add tests for versioning (perhaps in their own module)

// The output should not include children with the "children" option set to false
    jqUnit.asyncTest("Retrieve record with the 'children' argument set to false...", function() {
        // TODO:  This test depends on the existence of a single record.  We should adjust to use test data instead.
        request.get("http://localhost:" + read.config.port + "/record/xMPPChatID?children=false", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertTrue("There should have been a record returned...", jsonData.record);
            if (jsonData.record) {
                jqUnit.assertUndefined("Record '" + jsonData.record.uniqueId + "' should not have contained any children", jsonData.record.aliases);
            }
        });
    });

// The output from "terms" and "records" should include children when the "children" option is set to true
    jqUnit.asyncTest("Retrieve record with the 'children' argument set to true...", function() {
        request.get("http://localhost:" + read.config.port + "/record/xMPPChatID?children=true", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertTrue("There should have been a record returned...", jsonData.record);
            if (jsonData.record) {
                jqUnit.assertNotUndefined("Record '" + jsonData.record.uniqueId + "' should have contained any children", jsonData.record.aliases);
            }
        });
    });

// The "children" parameter should not cause problems when loading something that doesn't have children (i.e. an alias)
    jqUnit.asyncTest("Retrieve record with the 'children' argument set to true...", function() {
        request.get("http://localhost:" + read.config.port + "/record/XMPP+Chat+ID?children=true", function(error, response, body) {
            jqUnit.start();

            testUtils.isSaneResponse(jqUnit, error, response, body);
            var jsonData = JSON.parse(body);

            jqUnit.assertTrue("There should have been a record returned...", jsonData.record);
            if (jsonData.record) {
                jqUnit.assertUndefined("Record '" + jsonData.record.uniqueId + "' should have contained any children", jsonData.record.aliases);
            }
        });
    });

    jqUnit.onAllTestsDone.addListener(function() {
        // Shut down express (seems to happen implicitly, so commented out)
//    http.server.close();
    });
};

read.loadPouch();
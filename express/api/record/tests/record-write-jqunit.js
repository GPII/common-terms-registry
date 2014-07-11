// tests for all write methods
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ctr.record.tests.write";
var write = fluid.registerNamespace(namespace);

write.loader = require("../../../configs/lib/config-loader");
write.config = write.loader.loadConfig(require("../../../configs/express/test.json"));

// manually point at pouch instead of CouchDB
write.pouchBaseUrl = "http://localhost:" + write.config.port + "/pouch";
write.pouchDbUrl = write.pouchBaseUrl + "/tr";

write.config["couch.url"] = write.pouchDbUrl;

// TODO:  When we add support for versioning, we should disable it for these tests and test the version code separately

// TODO:  When we add support for attribution, we should disable it for these tests and test the attribution code separately

write.testUtils = require("../../tests/lib/testUtils")(write.config);
write.request = require("request");

// TODO: Move to test data directory and load using "require"
write.validRecord = {
    "uniqueId": "validRecord",
    "type": "general",
    "termLabel": "A test term",
    "definition": "This is a sample term created for test purposes."
};
write.invalidRecord = {
    "uniqueId": "invalidRecord",
    "type": "alias",
    "termLabel": "A test alias with missing data.",
    "definition": "This record is missing an aliasOf field."
};

write.loadPouch = function() {
    write.pouch = require('../../tests/lib/pouch')(write.config);

    write.pouch.start(function() {
        write.startExpress();
    });
};

// Spin up an express instance
write.startExpress = function() {
    write.express = require('../../tests/lib/express')(write.config);

    write.express.start(function() {

        // Mount all variations on the module
        var record = require('../../record')(write.config);
        write.express.app.use('/record', record);

        // TODO: Mount user management functions

        // Add PouchDB with simulated CouchDb REST endpoints
        write.express.app.use('/pouch', require('express-pouchdb')(write.pouch.MemPouchDB));

        // Give express-pouch a few seconds to start up
        setTimeout(write.loadData, 2000);
    });
};

write.loadData = function() {
    write.pouch.loadData(write.runTests);
};

write.runTests = function() {
    console.log("Running tests...");

    var jqUnit = require("jqUnit");
    jqUnit.module("Record API (write)");

    jqUnit.asyncTest("Use PUT to create a new record", function() {
        var options = {
            "url": "http://localhost:" + write.config.port + "/record/",
            "json": write.validRecord
        };

        var request = require("request");
        request.put(options, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertNull("There should be no errors returned",e);

            jqUnit.stop();

            // Make sure the record was actually created
            var verifyRequest = require("request");
            verifyRequest.get("http://localhost:" + write.express.app.get('port') + "/record/" + write.validRecord.uniqueId,function(e,r,b) {
                jqUnit.start();
                jqUnit.assertNull("There should be no errors returned",e);

                var jsonData = JSON.parse(b);

                jqUnit.assertValue("There should be a record returned.", jsonData.record);

                if (jsonData.record && jsonData.record !== undefined) {
                    // The response should closely match the record we submitted
                    Object.keys(write.validRecord).forEach(function(field){
                        jqUnit.assertEquals("The field '" + field + "' should match what we submitted.", write.validRecord[field], jsonData.record[field]);
                    });
                }
            });
        });
    });

    // TODO:  Test that PUTTING a new record only works when a user is logged in

    jqUnit.asyncTest("Use PUT to update an existing record", function() {

        var originalRecord = JSON.parse(JSON.stringify(write.validRecord));
        originalRecord.uniqueId = "updateTest";

        var updatedRecord = JSON.parse(JSON.stringify(originalRecord));
        updatedRecord.definition="This has been updated";

        var request = require("request");

        var createOptions = {
            "url": "http://localhost:" + write.config.port + "/record/",
            "json": originalRecord
        };

        request.put(createOptions, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertNull("There should be no errors returned",e);

            jqUnit.stop();

            var updateOptions = {
                "url": "http://localhost:" + write.config.port + "/record/",
                "json": updatedRecord
            };
            // PUT the update
            request.put(updateOptions, function(e,r,b) {
                jqUnit.start();

                jqUnit.assertNull("There should be no errors returned",e);

                jqUnit.stop();

                // Check the results
                request.get("http://localhost:" + write.express.app.get('port') + "/record/" + originalRecord.uniqueId, function(e,r,b) {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no errors returned",e);

                    var jsonData = JSON.parse(b);

                    jqUnit.assertValue("There should be a record returned.", jsonData.record);

                    if (jsonData.record && jsonData.record !== undefined) {
                        // The response should closely match the record we submitted
                        Object.keys(updatedRecord).forEach(function(field){
                            jqUnit.assertEquals("The field '" + field + "' should match what we submitted.", updatedRecord[field], jsonData.record[field]);
                        });
                    }
                });
            });
        });
    });

    // We cannot rely on our validate_doc_update function in Couch to enforce basic validation from within Pouch:
    // https://github.com/pouchdb/pouchdb/issues/1412
//    jqUnit.asyncTest("Use PUT to add an invalid record", function() {
//        var options = {
//            "url": "http://localhost:" + write.config.port + "/record/",
//            "json": write.invalidRecord
//        };
//
//        var request = require("request");
//        request.put(options, function(e,r,b) {
//            jqUnit.start();
//
//            jqUnit.assertNull("There should be no errors returned",e);
//
//            console.log("b:" + JSON.stringify(b));
//            jqUnit.assertFalse("The response should not be 'OK'.", b.ok);
//
//            jqUnit.stop();
//
//            // Make sure the record was not actually created
//            request.get("http://localhost:" + write.express.app.get('port') + "/record/" + write.invalidRecord.uniqueId,function(e,r,b) {
//                jqUnit.start();
//                jqUnit.assertNull("There should be no errors returned",e);
//
//                var jsonData = JSON.parse(b);
//
//                jqUnit.assertTrue("There should be no record returned.", jsonData.record === null || jsonData.record === undefined || jsonData.record === {});
//            });
//        });
//    });

    jqUnit.asyncTest("Use POST to create a new record", function() {
        var options = {
            "url": "http://localhost:" + write.config.port + "/record/",
            "json": write.validRecord
        };

        var request = require("request");
        request.post(options, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertNull("There should be no errors returned",e);

            jqUnit.stop();

            // Make sure the record was actually created
            request.get("http://localhost:" + write.express.app.get('port') + "/record/" + write.validRecord.uniqueId,function(e,r,b) {
                jqUnit.start();
                jqUnit.assertNull("There should be no errors returned",e);

                var jsonData = JSON.parse(b);

                jqUnit.assertValue("There should be a record returned.", jsonData.record);

                if (jsonData.record && jsonData.record !== undefined) {
                    // The response should closely match the record we submitted
                    Object.keys(write.validRecord).forEach(function(field){
                        jqUnit.assertEquals("The field '" + field + "' should match what we submitted.", write.validRecord[field], jsonData.record[field]);
                    });
                }
            });
        });
    });

    // TODO:  Test that POSTING a new record only works when a user is logged in

    // TODO:  Test using POST with an invalid record
    // We cannot rely on our validate_doc_update function in Couch to enforce basic validation from within Pouch:
    // https://github.com/pouchdb/pouchdb/issues/1412


    // TODO:  Test that DELETE only works when a user is logged in

    jqUnit.asyncTest("Use DELETE to remove an existing record", function() {

        var originalRecord = JSON.parse(JSON.stringify(write.validRecord));
        originalRecord.uniqueId = "deleteTest";

        var request = require("request");

        var createOptions = {
            "url": "http://localhost:" + write.config.port + "/record/",
            "json": originalRecord
        };

        request.put(createOptions, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertNull("There should be no errors returned",e);

            jqUnit.stop();

            // DELETE the record
            request.del("http://localhost:" + write.config.port + "/record/" + originalRecord.uniqueId, function(e,r,b) {
                jqUnit.start();

                jqUnit.assertNull("There should be no errors returned",e);

                jqUnit.stop();

                console.log(JSON.stringify(b));

                // Make sure the record no longer exists
                request.get("http://localhost:" + write.express.app.get('port') + "/record/" + originalRecord.uniqueId, function(e,r,b) {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no errors returned",e);

                    var jsonData = JSON.parse(b);

                    jqUnit.assertTrue("The deleted record should not be returned.", jsonData.record === null || jsonData.record === undefined || jsonData.record === {});
                });
            });
        });
    });

    // TODO:  Test versioning on all successful adds and updates

    jqUnit.onAllTestsDone.addListener(function() {
        // Shut down express (seems to happen implicitly, so commented out)
        // http.server.close();
    });
};

write.loadPouch();

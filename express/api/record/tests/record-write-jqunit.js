// tests for all write methods
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ctr.record.tests.write";
var write = fluid.registerNamespace(namespace);

write.loader = require("../../../configs/lib/config-loader");
write.config = write.loader.loadConfig(require("../../../configs/express/test-pouch.json"));

// TODO:  When we add support for versioning, we should disable it for these tests and test the version code separately

// TODO:  When we add support for attribution, we should test it

write.testUtils = require("../../tests/lib/testUtils")(write.config);
write.request = require("request");

write.validRecord = require("../../tests/data/valid");
write.invalidRecord = require("../../tests/data/invalid");

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

        // Load the user management library so we can test permissions, etc.
        var couchUser = require('express-user-couchdb');

        var bodyParser = require('body-parser');
        var router = write.express.express.Router();
        router.use(bodyParser.json());
        router.use(couchUser(write.config));
        write.express.app.use(router);

        write.runTests();
    });
};

write.runTests = function() {
    console.log("Running tests...");

    var jqUnit = require("jqUnit");
    jqUnit.module("Record API (write)");

    jqUnit.asyncTest("Use PUT to create a new record (not logged in)", function() {
        var options = {
            "url": "http://localhost:" + write.config.port + "/record/",
            "json": write.validRecord
        };

        var request = require("request");
        request.put(options, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertEquals("The response should indicate that a login is required.", 401, r.statusCode);
            jqUnit.assertFalse("The response should not be 'ok'", b.ok);

            jqUnit.assertNull("There should not be a record returned.", b.record);
        });
    });

    jqUnit.asyncTest("Use PUT to create a new record (logged in)", function() {
        var request = require("request");
        write.jar = request.jar();
        request.defaults({"jar":write.jar});

        var loginOptions = {
            "url": "http://localhost:" + write.config.port + "/api/user/signin",
            "json": { "name": "admin", "password": "admin"},
            "jar": write.jar
        };
        request.post(loginOptions,function(e,r,b){
            jqUnit.start();
            jqUnit.assertNull("There should be no login errors returned",e);
            jqUnit.stop();

            var options = {
                "url": "http://localhost:" + write.config.port + "/record/",
                "json": write.validRecord,
                "jar": write.jar
            };
            request.put(options, function(e,r,b) {
                jqUnit.start();
                jqUnit.assertNull("There should be no errors returned",e);
                jqUnit.stop();

                console.log("put body:" + JSON.stringify(b));

                // Make sure the record was actually created
                request.get("http://localhost:" + write.express.app.get('port') + "/record/" + write.validRecord.uniqueId,function(e,r,b) {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no errors returned",e);

                    console.log("verify body:" + b);

                    var jsonData = JSON.parse(b);
                    debugger;
                    jqUnit.assertValue("There should be a record returned.", jsonData.record);

                    if (jsonData.record && jsonData.record !== undefined) {
                        // The response should closely match the recwrite.express.appord we submitted
                        Object.keys(write.validRecord).forEach(function(field){
                            jqUnit.assertEquals("The field '" + field + "' should match what we submitted.", write.validRecord[field], jsonData.record[field]);
                        });
                    }
                    jqUnit.stop();

                    var logoutOptions = {
                        "url": "http://localhost:" + write.config.port + "/api/user/signout",
                        "jar": write.jar
                    };
                    request.post(logoutOptions,function(e,r,b) {
                        jqUnit.start();
                        jqUnit.assertNull("There should be no logout errors returned",e);
                    });
                });
            });
        });
    });

    jqUnit.asyncTest("Use PUT to update an existing record (logged in)", function() {

        var originalRecord = JSON.parse(JSON.stringify(write.validRecord));
        originalRecord.uniqueId = "updateTest";

        var updatedRecord = JSON.parse(JSON.stringify(originalRecord));
        updatedRecord.definition="This has been updated";

        var createOptions = {
            "url": "http://localhost:" + write.config.port + "/record/",
            "json": originalRecord
        };

        var loginRequest = require("request");
        var loginOptions = {
            "url": "http://localhost:" + write.config.port + "/api/user/signin",
            "json": { "name": "admin", "password": "admin"}
        };
        loginRequest.post(loginOptions,function(e,r,b){
            jqUnit.start();
            jqUnit.assertNull("There should be no login errors returned",e);
            jqUnit.stop();

            var request = require("request");
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

                        jqUnit.assertNotNull("There should be a record returned.", jsonData.record);

                        if (jsonData.record && jsonData.record !== undefined) {
                            // The response should closely match the record we submitted
                            Object.keys(updatedRecord).forEach(function(field){
                                jqUnit.assertEquals("The field '" + field + "' should match what we submitted.", updatedRecord[field], jsonData.record[field]);
                            });
                        }
                        jqUnit.stop();

                        var logoutRequest = require("request");
                        var logoutOptions = {
                            "url": "http://localhost:" + write.config.port + "/api/user/signout"
                        };
                        logoutRequest.post(logoutOptions,function(e,r,b) {
                            jqUnit.start();
                            jqUnit.assertNull("There should be no logout errors returned",e);
                        });
                    });
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

    jqUnit.asyncTest("Use POST to create a new record (not logged in)", function() {
        var options = {
            "url": "http://localhost:" + write.config.port + "/record/",
            "json": write.validRecord
        };

        var request = require("request");
        request.post(options, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertEquals("The response should indicate that a login is required.", 401, r.statusCode);
            jqUnit.assertFalse("The response should not be 'ok'", b.ok);
        });
    });

    jqUnit.asyncTest("Use POST to create a new record (logged in)", function() {
        var options = {
            "url": "http://localhost:" + write.config.port + "/record/",
            "json": write.validRecord
        };

        var loginRequest = require("request");
        var loginOptions = {
            "url": "http://localhost:" + write.config.port + "/api/user/signin",
            "json": { "name": "admin", "password": "admin"}
        };
        loginRequest.post(loginOptions,function(e,r,b){
            jqUnit.start();
            jqUnit.assertNull("There should be no login errors returned",e);
            jqUnit.stop();

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

                    jqUnit.stop();

                    var logoutRequest = require("request");
                    var logoutOptions = {
                        "url": "http://localhost:" + write.config.port + "/api/user/signout"
                    };
                    logoutRequest.post(logoutOptions,function(e,r,b) {
                        jqUnit.start();
                        jqUnit.assertNull("There should be no logout errors returned",e);
                    });
                });
            });
        });
    });

    // TODO:  Test that POSTING a new record only works when a user is logged in

    // TODO:  Test using POST with an invalid record
    // We cannot rely on our validate_doc_update function in Couch to enforce basic validation from within Pouch:
    // https://github.com/pouchdb/pouchdb/issues/1412


    // TODO:  Test that DELETE only works when a user is logged in

    jqUnit.asyncTest("Use DELETE to remove an existing record (not logged in)", function() {

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

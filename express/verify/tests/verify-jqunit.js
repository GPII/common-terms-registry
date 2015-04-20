// tests for the user verification process
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ctr.verify.test";
var verifyTests = fluid.registerNamespace(namespace);

verifyTests.loader = require("../../configs/lib/config-loader");
verifyTests.config = verifyTests.loader.loadConfig(require("../../configs/express/test-pouch.json"));

verifyTests.testUtils = require(".././testUtils")(verifyTests.config);
verifyTests.request = require("request");

verifyTests.loadPouch = function() {
    verifyTests.pouch = require('.././pouch')(verifyTests.config);

    verifyTests.pouch.start(function() {
        verifyTests.startExpress();
    });
};


// Spin up an express instance
verifyTests.startExpress = function() {
    verifyTests.express = require('.././express')(verifyTests.config);

    verifyTests.express.start(function() {
        var verify = require('../index.js')(verifyTests.config);
        verifyTests.express.app.use('/verify', verify);

        // Load the user management library so we can test real verification calls
        var couchUser = require('express-user-couchdb');

        var bodyParser = require('body-parser');
        var router = verifyTests.express.express.Router();
        router.use(bodyParser.json());
        router.use(couchUser(verifyTests.config));
        verifyTests.express.app.use(router);

        verifyTests.runTests();
    });
};

verifyTests.runTests = function() {
    console.log("Running tests...");

    var jqUnit = require("jqUnit");
    jqUnit.module("Verification page (/verify) tests...");

    //jqUnit.asyncTest("Verify an unverified user (valid code)...", function() {
    //    var loginOptions = {
    //        "url": "http://localhost:" + verifyTests.config.port + "/api/user/signin",
    //        "json": { "name": "unverified", "password": "admin"}
    //    };
    //
    //    // unverified user should not be able to log in...
    //    var loginRequest = require("request");
    //    loginRequest.post(loginOptions, function(e,r,b) {
    //        jqUnit.start();
    //
    //        jqUnit.assertEquals("The response should have a status code that indicates that a login is required.", 401, r.statusCode);
    //        jqUnit.assertFalse("The response should not be 'ok'", b.ok);
    //        jqUnit.assertTrue("The response should contain the word 'verify'", b.message.indexOf("verify") !== -1);
    //
    //        jqUnit.stop();
    //
    //        // Verify request
    //        var verifyOptions = {
    //            "url": "http://localhost:" + verifyTests.config.port + "/verify/0fac9d70-9b05-11e4-84d9-03e45bc462e2"
    //        };
    //
    //        var verifyRequest = require("request");
    //        verifyRequest.get(verifyOptions, function(e,r,b) {
    //            jqUnit.start();
    //
    //            jqUnit.assertEquals("The response should have a normal status code.", 200, r.statusCode);
    //            jqUnit.assertTrue("The response should be 'ok'", b.ok);
    //            jqUnit.assertTrue("The response should contain the word 'verify'", b.message.indexOf("verify") !== -1);
    //
    //            jqUnit.stop();
    //
    //            var secondLoginRequest = require("request");
    //            secondLoginRequest.put(loginOptions, function(e,r,b) {
    //                jqUnit.start();
    //
    //                jqUnit.assertEquals("The response should have a normal status code.", 200, r.statusCode);
    //                jqUnit.assertTrue("The response should be 'ok'", b.ok);
    //                jqUnit.assertNotUndefined("The response should contain a user record'", b.user);
    //
    //                jqUnit.stop();
    //            });
    //        });
    //
    //
    //    });
    //});

    // Try the verification script with a bogus verification code
    jqUnit.asyncTest("Verify a user (invalid code)...", function() {
        // Verify request
        var verifyOptions = {
            "url": "http://localhost:" + verifyTests.config.port + "/verify/totalGibberish"
        };

        var verifyRequest = require("request");
        verifyRequest.get(verifyOptions, function(e,r,b) {
            jqUnit.start();

            debugger;
            var fs = require("fs");
            fs.writeFileSync("/tmp/output.txt", b);

            jqUnit.assertEquals("The response should not have a normal status code.", 500, r.statusCode);
        });
    });

    // Try the verification script with a bogus user

    // Test a timeout of the upstream service using nock

};

verifyTests.loadPouch();

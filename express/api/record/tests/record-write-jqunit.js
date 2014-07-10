// tests for all write methods
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ctr.record.tests.write";
var write = fluid.registerNamespace(namespace);

//write.PouchDB = require('pouchdb');
//write.tr = new write.PouchDB({"name": "tr", "db": require('memdown'), "prefix": '/tmp/my-temp-pouch/'});

write.PouchDB = require('pouchdb');
write.MemPouchDB = write.PouchDB.defaults({db: require('memdown')});
write.tr = new write.MemPouchDB("tr");

write.loader = require("../../../configs/lib/config-loader");
write.config = write.loader.loadConfig(require("../../../configs/express/test.json"));

write.port = write.config.port || process.env.PORT || 4895;

// manually point at pouch instead of CouchDB
write.pouchBaseUrl = "http://localhost:" + write.port + "/pouch";
write.pouchDbUrl = write.pouchBaseUrl + "/tr";

write.config["couch.url"] = write.pouchDbUrl;

// TODO:  When we add support for versioning, we should disable it for these tests and test the version code separately

// TODO:  When we add support for attribution, we should disable it for these tests and test the attribution code separately

write.testUtils = require("../../tests/lib/testUtils")(write.config);
write.request = require("request");

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

write.express = require('express');
write.app = write.express();

// Spin up an express instance
write.startExpress = function() {
    var app = write.app;
    app.set('port', write.port);

    // Mount all variations on the module
    var record = require('../../record')(write.config);
    app.use('/record', record);


    // Add PouchDB with simulated CouchDb REST endpoints
    app.use('/pouch', require('express-pouchdb')(write.MemPouchDB));

    var http = require("http");
    http.createServer(app).listen(app.get('port'), function(){
        console.log('Express server listening on port ' + app.get('port'));

        console.log("Express started...");

        // TODO:  Find a better way to do this

        // Give express-pouch a few seconds to start up
        setTimeout(write.loadViews,2500);
    });
};



write.loadViews = function() {
    var couchappUtils = require("../../tests/lib/couchappUtils")(write.config);

    var path = __dirname + "/../../../../couchapp/api/";
    var viewContent = couchappUtils.loadCouchappViews(path);

    var options = {
        "url": write.pouchDbUrl + "/_design/api",
        "body": JSON.stringify(viewContent),
        "headers": { "Content-Type": "application/json"}
    };

    write.request.put(options,function(e,r,b) {
        if (e && e !== null) {
            return console.log(e);
        }

        console.log("Views loaded...");
        write.loadData();
    });
};

write.loadData = function() {
    var data = require("../../tests/data/data.json");

    // Hit our express instance, for some reason the bulk docs function doesn't seem to like us
    var options = {
        "url": write.pouchDbUrl + "/_bulk_docs",
        "json": data
    };

    write.request.post(options,function(e,r,b) {
        if (e && e !== null) {
            return console.log(e);
        }

        console.log("Data loaded...");

        write.runTests();
    });
};

write.runTests = function() {
    console.log("Running tests...");

    var jqUnit = require("jqUnit");
    jqUnit.module("Record API (write)");

    jqUnit.asyncTest("Use PUT to create a new record", function() {
        var options = {
            "url": "http://localhost:" + write.port + "/record/",
            "json": write.validRecord
        };

        var request = require("request");
        request.put(options, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertNull("There should be no errors returned",e);

            jqUnit.stop();

            // Make sure the record was actually created
            request.get("http://localhost:" + write.app.get('port') + "/record/" + write.validRecord.uniqueId,function(e,r,b) {
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

    jqUnit.asyncTest("Use PUT to update an existing record", function() {

        var originalRecord = JSON.parse(JSON.stringify(write.validRecord));
        originalRecord.uniqueId = "updateTest";

        var updatedRecord = JSON.parse(JSON.stringify(originalRecord));
        updatedRecord.definition="This has been updated";

        var request = require("request");

        var createOptions = {
            "url": "http://localhost:" + write.port + "/record/",
            "json": originalRecord
        };

        request.put(createOptions, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertNull("There should be no errors returned",e);

            jqUnit.stop();

            var updateOptions = {
                "url": "http://localhost:" + write.port + "/record/",
                "json": updatedRecord
            };
            // PUT the update
            request.put(updateOptions, function(e,r,b) {
                jqUnit.start();

                jqUnit.assertNull("There should be no errors returned",e);

                jqUnit.stop();

                // Check the results
                request.get("http://localhost:" + write.app.get('port') + "/record/" + originalRecord.uniqueId, function(e,r,b) {
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
//            "url": "http://localhost:" + write.port + "/record/",
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
//            request.get("http://localhost:" + write.app.get('port') + "/record/" + write.invalidRecord.uniqueId,function(e,r,b) {
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
            "url": "http://localhost:" + write.port + "/record/",
            "json": write.validRecord
        };

        var request = require("request");
        request.post(options, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertNull("There should be no errors returned",e);

            jqUnit.stop();

            // Make sure the record was actually created
            request.get("http://localhost:" + write.app.get('port') + "/record/" + write.validRecord.uniqueId,function(e,r,b) {
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

    // TODO:  Test using POST with an invalid record
    // We cannot rely on our validate_doc_update function in Couch to enforce basic validation from within Pouch:
    // https://github.com/pouchdb/pouchdb/issues/1412

    jqUnit.asyncTest("Use DELETE to remove an existing record", function() {

        var originalRecord = JSON.parse(JSON.stringify(write.validRecord));
        originalRecord.uniqueId = "deleteTest";

        var request = require("request");

        var createOptions = {
            "url": "http://localhost:" + write.port + "/record/",
            "json": originalRecord
        };

        request.put(createOptions, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertNull("There should be no errors returned",e);

            jqUnit.stop();

            // DELETE the record
            request.del("http://localhost:" + write.port + "/record/" + originalRecord.uniqueId, function(e,r,b) {
                jqUnit.start();

                jqUnit.assertNull("There should be no errors returned",e);

                jqUnit.stop();

                console.log(JSON.stringify(b));

                // Make sure the record no longer exists
                request.get("http://localhost:" + write.app.get('port') + "/record/" + originalRecord.uniqueId, function(e,r,b) {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no errors returned",e);

                    var jsonData = JSON.parse(b);

                    jqUnit.assertTrue("The deleted record should not be returned.", jsonData.record === null || jsonData.record === undefined || jsonData.record === {});
                });
            });
        });
    });

    // TODO:  Test versioning on all successful adds and updates

    //jqUnit.asyncTest("Retrieve record with the 'children' argument set to false...", function() {
    //    // TODO:  This test depends on the existence of a single record.  We should adjust to use test data instead.
    //    request.get("http://localhost:" + app.get('port') + "/record/xMPPChatID?children=false", function(error, response, body) {
    //        jqUnit.start();
    //
    //        testUtils.isSaneResponse(jqUnit, error, response, body);
    //        var jsonData = JSON.parse(body);
    //
    //        jqUnit.assertTrue("There should have been a record returned...", jsonData.record);
    //        if (jsonData.record) {
    //            jqUnit.assertUndefined("Record '" + jsonData.record.uniqueId + "' should not have contained any children", jsonData.record.aliases);
    //        }
    //    });
    //});

    jqUnit.onAllTestsDone.addListener(function() {
        // Shut down express (seems to happen implicitly, so commented out)
    //    http.server.close();
        write.tr.viewCleanup();
        write.tr.destroy();
    });
};

write.startExpress();

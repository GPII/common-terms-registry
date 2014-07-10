// tests for all write methods
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ctr.record.tests.write";
var write = fluid.registerNamespace(namespace);

//write.PouchDB = require('pouchdb');
//write.tr = new write.PouchDB({"name": "tr", "db": require('memdown'), "prefix": '/tmp/my-temp-pouch/'});

write.PouchDB = require('pouchdb');
write.MemPouchDB = write.PouchDB.defaults({db: require('memdown')});
write.tr = new write.PouchDB({"name": "tr", "prefix": '/tmp'});

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
    "uniqueId": "testRecord",
    "type": "general",
    "termLabel": "A test term",
    "definition": "This is a sample term created for test purposes."
};
write.invalidRecord = {
    "uniqueId": "testRecord",
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
        write.loadData();
    });
};

write.loadData = function() {
    var data = require("../../tests/data/data.json");

    // Hit our express instance, for some reason the bulk docs function doesn't seem to like us
    var options = {
        "url": write.pouchDbUrl + "/_bulk_docs",
        "body": JSON.stringify(require("../../tests/data/data.json")),
        "headers": { "Content-Type": "application/json"}
    };

    write.request.post(options,function(e,r,b) {
        if (e && e !== null) {
            return console.log(e);
        }

        console.log("Data loaded...");
        write.loadViews();
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
            debugger;
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

    // TODO:  Test using PUT to update an existing record

    // TODO:  Test using PUT with an invalid record

    jqUnit.asyncTest("Use POST to create a new record", function() {
        var options = {
            "url": "http://localhost:" + write.port + "/record/",
            "json": write.validRecord
        };

        var request = require("request");
        request.post(options, function(e,r,b) {
            debugger;
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

    // TODO:  Test using DELETE to delete an existing record

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

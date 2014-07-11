// Utility functions to spin up pouch.
"use strict";

module.exports = function(config) {
    var fluid = require('infusion');
    var pouch = fluid.registerNamespace("gpii.ctr.api.tests.pouch");


    pouch.start = function(callback) {
        var PouchDB = require('pouchdb');
        pouch.MemPouchDB = PouchDB.defaults({db: require('memdown')});
        var tr = new pouch.MemPouchDB("tr");

        if (callback) {
            callback();
        }
    };

    pouch.loadData = function(callback) {
        loadViews(callback);
    };

    function loadViews(callback) {
        var couchappUtils = require("../../tests/lib/couchappUtils")(config);

        var path = __dirname + "/../../../../couchapp/api/";
        var viewContent = couchappUtils.loadCouchappViews(path);

        var options = {
            "url": config["couch.url"] + "/_design/api",
            "json": viewContent
        };

        var request = require("request");
        request.put(options,function(e,r,b) {
            if (e && e !== null) {
                return console.log("Error loading views into pouch:  " + e);
            }

            console.log("Views loaded...");
            loadData(callback);
        });
    }

    function loadData(callback) {
        var data = require("../../tests/data/records.json");

        // Hit our express instance, for some reason the bulk docs function doesn't seem to like us
        var options = {
            "url": config["couch.url"] + "/_bulk_docs",
            "json": data
        };

        var request = require("request");
        request.post(options,function(e,r,b) {
            if (e && e !== null) {
                return console.log("Error loading data into pouch:  " + e);
            }

            console.log("Data loaded...");

            if (callback) {
                callback();
            }
        });
    }

    return pouch;
};



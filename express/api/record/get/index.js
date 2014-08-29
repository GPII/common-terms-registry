"use strict";

module.exports = function(config) {
    var fluid = require('infusion');

    var schemaHelper = require("../../../schema/lib/schema-helper")(config);
    var namespace = "gpii.ctr.record.get";

    var record = fluid.registerNamespace(namespace);
    record.schema="record";
    record.error = require("../../lib/error")(config);
    var children = require('../../lib/children')(config, record);

    var express = require('express');

    var router = express.Router();

    router.get('/:uniqueId', function(req, res){
        // per-request variables need to be defined here, otherwise (for example) the results of the previous search will be returned if the next search has no records
        record.req = req;
        record.res = res;
        record.params = {};

        // TODO:  Add support for "versions" virtual element comprised of attachments

        schemaHelper.setHeaders(res, "message");

        record.results = {
            "ok": true,
            "params": record.params,
            "retrievedAt": new Date()
        };

        // Server config validation
        if (!config || !config['couch.url']) {
            var message = "Your instance is not configured correctly to enable record lookup.  You must have a couch.url variable configured.";
            console.log(message);
            return res.send(500,JSON.stringify({ ok:false, message: message }));
        }

        // User input validation
        try {
            if (!record.req.params || !record.req.params.uniqueId) {
                throw record.error.constructError(400,"You must provide the required query parameters to use this interface.");
            }

            if (record.req.query.children) {
                record.params.children = JSON.parse(record.req.query.children);
            }
        }
        catch(err) {
            return res.send(err.status ? err.status : 500, JSON.stringify(err));
        }

        // Get the record from couch
        var request = require('request');
        request.get(config['couch.url'] + "/_design/api/_view/entries?keys=%5B%22" + record.req.params.uniqueId + "%22%5D", function(e,r,b) {
            if (e) { return res.send(500,JSON.stringify({ok: false, message: "Error retrieving record from couchdb", error: e}));}

            var jsonData = JSON.parse(b);
            if (!jsonData.rows || jsonData.rows.length === 0) {
                return res.send(404,JSON.stringify({ok:false, message: "Record not found." }));
            }
            else {
                record.results.record = jsonData.rows[0].value;

                if (record.results.record.type.toLowerCase() === "term" && record.params.children) {
                    // TODO:  This is a temporary hack to pass the predigested parent record data to the common
                    children.termHash = {};
                    children.termHash[record.results.record.uniqueId] = record.results.record;

                    // retrieve the child records via /tr/_design/api/_view/children?keys=
                    var childRecordOptions = {
                        "url" : config['couch.url'] + "/_design/api/_view/children?keys=" + JSON.stringify([record.results.record.uniqueId]),
                        "json": true
                    };

                    var request = require('request');
                    request.get(childRecordOptions, record.getChildRecords);
                }
                else {
                    schemaHelper.setHeaders(res, record.results.record.type);
                    res.send(200, JSON.stringify(record.results));
                }
            }
        });
    });

    router.get("/", function(req,res) {
        schemaHelper.setHeaders(res, "message");
        return res.send(400,{ok: false, message: "You must provide the required uniqueId in the path to use this interface."});
    });

    return router;
};

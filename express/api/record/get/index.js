"use strict";

module.exports = function(config) {
    var fluid = require('infusion');

    var schemaHelper = require("../../../schema/lib/schema-helper")(config);
    var namespace    = "gpii.ctr.record.get";

    var record       = fluid.registerNamespace(namespace);
    record.schema    = "record";
    record.error     = require("../../lib/error")(config);
    var children     = require('../../lib/children')(config, record);

    var express      = require('express');
    var filters      = require("secure-filters");


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
            return res.status(500).send(JSON.stringify({ ok:false, message: message }));
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
            return res.status(err.status ? err.status : 500).send(JSON.stringify(err));
        }

        // Get the record from couch
        var sanitizedId = filters.uri(record.req.params.uniqueId);
        var request = require('request');
        request.get(config['couch.url'] + "/_design/api/_view/entries?keys=%5B%22" + sanitizedId + "%22%5D", function(e,r,b) {
            if (e) { return res.status(500).send(JSON.stringify({ok: false, message: "Error retrieving record from couchdb", error: e}));}

            var jsonData = JSON.parse(b);
            if (!jsonData.rows || jsonData.rows.length === 0) {
                return res.status(404).send(JSON.stringify({ok:false, message: "A record with the unique ID '" + sanitizedId + "' could not be found." }));
            }
            else {
                record.results.record = jsonData.rows[0].value;
                var sanitizedParentId = filters.uri(record.results.record.uniqueId);

                if (record.results.record.type.toLowerCase() === "term" && record.params.children) {
                    // TODO:  This is a temporary hack to pass the predigested parent record data to the common hashXM
                    children.termHash = {};
                    children.termHash[sanitizedParentId] = record.results.record;

                    // retrieve the child records via /tr/_design/api/_view/children?key=
                    var childRecordOptions = {
                        "url" : config['couch.url'] + "/_design/api/_view/children?key=%22" + sanitizedParentId + "%22",
                        "json": true
                    };

                    var request = require('request');
                    request.get(childRecordOptions, record.getChildRecords);
                }
                else {
                    schemaHelper.setHeaders(res, record.results.record.type);
                    res.status(200).send( JSON.stringify(record.results));
                }
            }
        });
    });

    router.get("/", function(req,res) {
        schemaHelper.setHeaders(res, "message");
        return res.status(400).send({ok: false, message: "You must provide the required uniqueId in the path to use this interface."});
    });

    return router;
};

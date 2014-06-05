"use strict";

module.exports = function(config) {
    var fluid = require('infusion');

    var schemaHelper = require("../../schema/lib/schema-helper")(config);
    var namespace = "gpii.ctr.record";
    var record = fluid.registerNamespace(namespace);
    var request = require('request');

    record.parseAndValidateInput = function() {
        if (!record.req.params || !record.req.params.uniqueId) {
            throw record.constructError(400,"You must provide the required query parameters to use this interface.");
        }
    };

    // TODO:  create a library where we reuse patterns like this
    record.constructError = function(status, message) {
        var error = new Error(message);
        error.status = status;
        error.ok = false;
        return error;
    };

    var express = require('express');

    var router = express.Router();
    router.get('/:uniqueId', function(req, res){
        // per-request variables need to be defined here, otherwise (for example) the results of the previous search will be returned if the next search has no records
        record.req = req;
        record.res = res;

        // TODO:  Add support for "versions" virtual element comprised of attachments

        // TODO:  Add support for "children" option (to allow output to mimic search output).

        schemaHelper.setHeaders(res, "message");

        record.results = {
            "ok": true,
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
            record.parseAndValidateInput();
        }
        catch(err) {
            return res.send(err.status ? err.status : 500, JSON.stringify(err));
        }

        // Get the record from couch
        request.get(config['couch.url'] + "/_design/api/_view/entries?keys=%5B%22" + record.req.params.uniqueId + "%22%5D", function(e,r,b) {
            if (e) { return res.send(500,JSON.stringify({ok: false, message: "Error retrieving record from couchdb", error: e}));}

            var jsonData = JSON.parse(b);
            if (!jsonData.rows || jsonData.rows.length === 0) {
                return res.send(404,JSON.stringify({ok:false, message: "Record not found." }));
            }
            else {
                record.results.record = jsonData.rows[0].value;
                schemaHelper.setHeaders(res, record.results.record.type);
                res.send(200, JSON.stringify(record.results));
            }
        });
    });

    router.post('/', function(req, res){
        // TODO:  Add Create REST end point (POST /api/record)

        // Create a new record based on the data submitted, adding the initial version field, set to 1
    });


    router.put('/', function(req, res){
        // TODO:  Add Update REST end point (PUT /api/record)

        // Add the new record as an unpublished draft attachment
    });

    router.get('/:uniqueId/publish', function(req, res){
        // TODO:  Add a mechanism for publishing drafts (GET /api/record/{id}/publish?version=X)

        // Get the current document's _rev value

        // Copy the existing record as an attachment of itself

        // Get the updated _rev value from the response

        // Retrieve the draft

        // Replace the document with the draft
    });

    router.delete('/:uniqueId', function(req, res){
        // TODO:  Add Delete REST end point (DELETE /api/record/{id})

        // Get the current document's _rev value

        // Copy the existing record as an attachment of itself

        // Get the updated _rev value from the response

        // Update the existing record to change its status to deleted

    });

    router.get("/", function(req,res) {
        schemaHelper.setHeaders(res, "message");
        return res.send(400,{ok: false, message: "You must provide the required uniqueId in the path to use this interface."});
    });

    return router;
};

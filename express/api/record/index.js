"use strict";

module.exports = function(config) {
    var fluid = require('infusion');

    var schemaHelper = require("../../schema/lib/schema-helper")(config);
    var namespace = "gpii.ctr.record";

    var record = fluid.registerNamespace(namespace);
    record.schema="record";

    var children = require('../lib/children')(config, record);

    var request = require('request');

    record.parseAndValidateInput = function() {
        if (!record.req.params || !record.req.params.uniqueId) {
            throw record.constructError(400,"You must provide the required query parameters to use this interface.");
        }

        if (record.req.query.children) {
            record.params.children = JSON.parse(record.req.query.children);
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

                if (record.results.record.type.toLowerCase() === "general" && record.params.children) {
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

    router.post('/', function(req, res){
        // TODO:  Add Create REST end point (POST /api/record)

        // TODO:  Check to make sure no record already exists with this uniqueId

        // TODO:  Add support for versioning
    });


    // Update REST end point (PUT /api/record)
    router.put('/', function(req, res){
        // Make sure the current record has at least a uniqueId
        if (!req.body || !req.body.uniqueId) {
            return res.send(400,{"ok":"false","message": "You must provide a uniqueId of the record you wish to update."});
        }

        // TODO:  Make sure the user is logged in

        // Get the current document
        var readRequest = require('request');
        readRequest.get(config['couch.url'] + "/_design/api/_view/entries?key=%22" + req.body.uniqueId + "%22", function(readError,readResponse,readBody) {
            if (readError) {
                console.log(readError);
                return res.send(500,{"ok":"false","message": "There was an error retrieving the record with uniqueId '" + req.body.uniqueId + "'..."});
            }

            var jsonData = JSON.parse(readBody);
            if (!jsonData.rows || jsonData.rows.length === 0) {
                // TODO: Write the method for posting to couch and reuse that here.
                return res.send(403,{"ok":"false","message":"Creation of new records using the PUT method is not currently supported.  Please use the POST method instead."});
            }

            var originalRecord = jsonData.rows[0].value;
            var newRecord = JSON.parse(JSON.stringify(originalRecord));

            // TODO: Only allow data that matches the Schema
            var allowedFields = ["type","permanency","namespace","uniqueId","notes","status", "termLabel","valueSpace","source","aliasOf","translationOf", "definition", "uses", "applicationUniqueFlag"];

            // Overlay the supplied data onto this record, deleting any
            allowedFields.forEach(function(field){
                if (req.body[field] !== undefined) {
                    if (req.body[field] ===  null) {
                        delete newRecord[field];
                    }
                    else {
                        newRecord[field] = req.body[field];
                    }
                }
            });

            // Set the "updated" field to the current date
            newRecord.updated = new Date().toISOString();

            // TODO: Set the "author" field to the current user

            // TODO: Validate the record against the relevant JSON schema

            // TODO: Make schema validation work for more than just the generic "record" type

            // TODO:  Add support for versioning

            // Upload the combined record to CouchDB
            var writeRequest = require('request');
            var writeOptions = {
                url: config['couch.url'] + "/" + newRecord._id,
                body: JSON.stringify(newRecord)
            };

            writeRequest.put(writeOptions, function(writeError, writeResponse, writeBody){
                if (writeError) {
                    console.log(writeError);
                    return res.send(500,{"ok":"false","message": "There was an error writing the record with uniqueId '" + req.body.uniqueId + "'..."});
                }

                if (writeResponse.statusCode === 201) {
                    res.send(200,{"ok":true,"message": "Record updated.", "record": newRecord});
                }
                else {
                    var jsonData = JSON.parse(writeBody);
                    res.send(writeResponse.statusCode, {"ok": false, "message": "There were one or more problems that prevented your update from taking place.", "errors": jsonData.reason.errors });
                }
            });
       });
    });

    router.get('/:uniqueId/publish', function(req, res){
        // TODO:  Once versioning is in place, add a mechanism for publishing drafts (GET /api/record/{id}/publish?version=X)

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

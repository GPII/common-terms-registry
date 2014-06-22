"use strict";

module.exports = function(config) {
    var fluid = require('infusion');

    var schemaHelper = require("../../../schema/lib/schema-helper")(config);
    var namespace = "gpii.ctr.record.put";

    var record = fluid.registerNamespace(namespace);
    record.error = require("../../lib/error")(config);
    record.schema="record";

    var request = require('request');

    record.parseAndValidateInput = function() {
        if (!record.req.params || !record.req.params.uniqueId) {
            throw record.constructError(400,"You must provide the required query parameters to use this interface.");
        }

        if (record.req.query.children) {
            record.params.children = JSON.parse(record.req.query.children);
        }
    };

    var express = require('express');

    var router = express.Router();

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

    return router;
};

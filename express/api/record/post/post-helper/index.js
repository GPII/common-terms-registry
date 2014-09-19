"use strict";

// Helper method to handle all creation of new records using POSTs to CouchDB

// The PUT method also allows creating new records, so we expose the same functions for both.
module.exports = function(config) {
    var schemaHelper = require("../../../../schema/lib/schema-helper")(config);
    return function(req, res){
        // Make sure the current record has at least a uniqueId
        if (!req.body || !req.body.uniqueId) {
            return res.status(400).send({"ok": false, "errors": { "uniqueId": "You must provide a uniqueId of the record you wish to update."}});
        }
        if (!req.session || !req.session.user) {
            return res.status(401).send(JSON.stringify({ok:false, message: "You must be logged in to use this function."}));
        }

        // TODO:  Confirm that the parent record exists when adding a child record.

        var checkRequest = require('request');
        checkRequest.get(config['couch.url'] + "/_design/api/_view/entries?key=%22" + req.body.uniqueId + "%22", function(checkError,checkResponse,checkBody) {
            if (checkError && checkError !== null) {
                return res.status(500).send({"ok":false, "message": "error confirming whether uniqueId is already used:" + JSON.stringify(checkError)});
            }

            var jsonData = JSON.parse(checkBody);
            if (jsonData.rows && jsonData.rows.length > 0) {
                return res.status(409).send({"ok":false, "message": "Could not post record because another record with the same uniqueId already exists."});
            }

            var originalRecord = req.body;
            var updatedRecord = JSON.parse(JSON.stringify(originalRecord));
            updatedRecord.updated = new Date().toISOString();

            // TODO: Set the "author" field to the current user (use req.session.user)

            var errors = schemaHelper.validate(updatedRecord.type, updatedRecord);
            if (errors) {
                return res.status(400).send({"ok": false, "message": "The data you have entered is not valid.  Please review.", "errors": errors});
            }

            var writeRequest = require('request');
            var writeOptions = {
                "url": config["couch.url"],
                "body": JSON.stringify(updatedRecord),
                "headers": {"Content-Type": "application/json"}
            };
            writeRequest.post(writeOptions, function(writeError, writeResponse, writeBody) {
                if (writeError) {
                    return res.status(500).send({"ok":false,"message": "There was an error saving data to couch:" + JSON.stringify(writeError)});
                }

                if (writeResponse.statusCode === 201) {
                    res.status(200).send({"ok":true,"message": "Record added.", "record": updatedRecord});
                }
                else {
                    var jsonData = JSON.parse(writeBody);
                    res.status(writeResponse.statusCode).send({"ok": false, "message": "There were one or more problems that prevented your update from taking place.", "errors": JSON.stringify(jsonData.reason.errors) });
                }

                // TODO:  Add support for versioning
            });
        });
    };
};
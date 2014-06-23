"use strict";

// Helper method to handle all creation of new records using POSTs to CouchDB

// The PUT method also allows creating new records, so we expose the same functions for both.
module.exports = function(config) {
    return function(req, res){
        var checkRequest = require('request');
        checkRequest.get(config['couch.url'] + "/_design/api/_view/entries?key=%22" + req.body.uniqueId + "%22", function(checkError,checkResponse,checkBody) {
            if (checkError && checkError !== null) {
                return res.send(500,{"ok":false, "message": "error confirming whether uniqueId is already used:" + JSON.stringify(checkError)});
            }

            var jsonData = JSON.parse(checkBody);
            if (jsonData.rows && jsonData.rows.length > 0) {
                return res.send(409,{"ok":false,"message": "Could not post record because another record with the same uniqueId already exists."});
            }

            var originalRecord = req.body;
            var updatedRecord = JSON.parse(JSON.stringify(originalRecord));
            updatedRecord.updated = new Date().toISOString();

            // TODO: Set the "author" field to the current user

            // TODO: Validate the record against the relevant JSON schema

            // TODO: Make schema validation work for more than just the generic "record" type

            var writeRequest = require('request');
            var writeOptions = {
                "url": config["couch.url"],
                "body": JSON.stringify(updatedRecord),
                "headers": {"Content-Type": "application/json"}
            };
            writeRequest.post(writeOptions, function(writeError, writeResponse, writeBody) {
                if (writeError) {
                    return res.send(500,{"ok":false,"message": "There was an error saving data to couch:" + JSON.stringify(writeError)});
                }

                if (writeResponse.statusCode === 201) {
                    res.send(200,{"ok":true,"message": "Record added.", "record": updatedRecord});
                }
                else {
                    var jsonData = JSON.parse(writeBody);
                    res.send(writeResponse.statusCode, {"ok": false, "message": "There were one or more problems that prevented your update from taking place.", "errors": JSON.stringify(jsonData.reason.errors) });
                }

                // TODO:  Add support for versioning
            });
        });
    };
};
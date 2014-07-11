"use strict";

module.exports = function(config) {
    var fluid = require('infusion');
    var namespace = "gpii.ctr.record.delete";
    var record = fluid.registerNamespace(namespace);

    var schemaHelper = require("../../../schema/lib/schema-helper")(config);

    record.error = require("../../lib/error")(config);

    var express = require('express');

    var router = express.Router();
    router.delete('/:uniqueId', function(req, res){
        schemaHelper.setHeaders(res, "message");

        if (!req.params || ! req.params.uniqueId) {
            return res.send(400,{"ok":"false","message": "You must provide a uniqueId of the record you wish to delete."});
        }

        if (!req.session || !req.session.user) {
            return res.send(401,JSON.stringify({ok:false, message: "You must be logged in to use this function."}));
        }

        // Get the current document (we need its _rev value)
        var readRequest = require('request');
        readRequest.get(config['couch.url'] + "/_design/api/_view/entries?key=%22" + req.params.uniqueId + "%22", function(readError,readResponse,readBody) {
            if (readError) {
                console.log(readError);
                return res.send(500,{"ok":"false","message": "There was an error retrieving the record with uniqueId '" + req.params.uniqueId + "'..."});
            }

            var jsonData = JSON.parse(readBody);

            // Confirm that the record actually exists
            if (!jsonData || !jsonData.rows || !jsonData.rows[0]) {
                console.log(jsonData);
                return res.send(500,{"ok":"false","message": "No record exists for uniqueId '" + req.params.uniqueId + "'..."});
            }

            var updatedRecord = JSON.parse(JSON.stringify(jsonData.rows[0].value));
            updatedRecord.status="deleted";
            updatedRecord.updated = new Date().toISOString();

            // TODO: Add support for versioning

            var writeRequest = require('request');
            writeRequest.del(config['couch.url'] + "/" + updatedRecord._id + "?rev=" + updatedRecord._rev, function(writeError, writeResponse, writeBody){
                if (writeError) {
                    console.log(writeError);
                    return res.send(500,{"ok":"false","message": "There was an error deleting the record with uniqueId '" + req.params.uniqueId + "'..."});
                }

                if (writeResponse.statusCode === 200) {
                    res.send(200,{"ok":true,"message": "Record deleted."});
                }
                else {
                    res.send(writeResponse.statusCode, {"ok": false, "message": "There were one or more problems that prevented your delete from taking place.", "errors": writeBody.reason && writeBody.reason.errors ? writeBody.reason.errors : writeBody });
                }
            });
        });
    });

    return router;
};

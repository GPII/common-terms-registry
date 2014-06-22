"use strict";

module.exports = function(config) {
    var fluid = require('infusion');

    var schemaHelper = require("../../schema/lib/schema-helper")(config);
    var namespace = "gpii.ctr.record.delete";

    var record = fluid.registerNamespace(namespace);
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
    router.delete('/:uniqueId', function(req, res){
        // TODO:  Add Delete REST end point (DELETE /api/record/{id})

        // Get the current document's _rev value

        // Copy the existing record as an attachment of itself

        // Get the updated _rev value from the response

        // Update the existing record to change its status to deleted

    });

    return router;
};

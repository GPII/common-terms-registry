"use strict";

module.exports = function(config) {
    var fluid = require('infusion');

    var namespace = "gpii.ctr.record.delete";

    var record = fluid.registerNamespace(namespace);
    var request = require('request');

    record.error = require("../../lib/error")(config);

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

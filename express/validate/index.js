// Find any records which are not valid according to the JSON schema
"use strict";
module.exports = function(config) {
    var express = require('express');
    var router  = express.Router();
    var request = require("request");
    var helper  = require("../schema/lib/schema-helper")(config);

    router.get("/",function(req, res) {
        // get the full list of records, validate each of them, and output a combined master report.
        request.get(config['base.url'] + "/api/records?limit=-1", function(e,r,b){
            var combinedErrors = {};
            var jsonData = JSON.parse(b);
            jsonData.records.forEach(function(record) {
                var errors = helper.validate(record.type, record);
                if (errors) { combinedErrors[record.uniqueId] = errors; }
            });

            res.status(200).send({"errors": combinedErrors});
        });

    });

    return router;
};


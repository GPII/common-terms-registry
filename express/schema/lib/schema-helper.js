"use strict";
module.exports = function(config) {
    var fluid = require('infusion');
    var helper = fluid.registerNamespace("gpii.ctr.schema.helper");

    var ZSchema   = require("z-schema");
    var options   = {
        noExtraKeywords: true
    };

    // We load the schemas on instantiation, as they are common to all requests and should not change in real time.
    helper.schemaContents = {};
    config.schemas.names.forEach(function(schemaName){
        var schemaContent = require("../schemas/" + schemaName + ".json");
        helper.schemaContents[schemaName] = schemaContent;
    });

    helper.setHeaders = function setHeaders (res, key) {
        var schemaUrl = config["base.url"] + "/schema/" + key + ".json";

        if (res.headersSent) {
            console.error("Can't set headers, they have already been sent.");
        }
        else {
            res.set('Content-Type', 'application/' + key + '+json; profile=' + schemaUrl);
            res.set('Link', schemaUrl + '#; rel="describedBy"');
        }
    };

    helper.validate = function(key,content) {
        // We instantiate a new validator each time to avoid detecting errors from previous runs or from other sessions.
        var validator = new ZSchema(options);

        // We have to validate all schemas at once to a) confirm that we have usable schemas and b) handle dependencies between schemas correctly for all record types.
        var schemasValid = validator.validateSchema(Object.keys(helper.schemaContents).map(function(v) { return helper.schemaContents[v]; }));
        if (!schemasValid) {
            return (helper.sanitizeValidationErrors(validator.getLastErrors()));
        }

        var contentValid = validator.validate(content, helper.schemaContents[key]);
        if (!contentValid) {
            return (helper.sanitizeValidationErrors(validator.getLastErrors()));
        }

        return undefined;
    };

    helper.sanitizeValidationErrors = function(errors) {
        /*
         z-schema gives us output like:

         [
             {
                 "code": "OBJECT_MISSING_REQUIRED_PROPERTY",
                 "params":["termLabel"],
                 "message":"Missing required property: termLabel",
                 "path":"#/"
             },
             {
                 "code":"PATTERN",
                 "params":["^[a-z]+([A-Z][a-z]+)*$","6DotComputerBrailleTable"],
                 "message":"String does not match pattern ^[a-z]+([A-Z][a-z]+)*$: 6DotComputerBrailleTable",
                 "path":"#/uniqueId"
             }
         ]

         See https://github.com/zaggino/z-schema/blob/master/src/Errors.js for the list of errors and
         https://github.com/zaggino/z-schema/blob/master/src/JsonValidation.js for the logic behind them.

         We need to turn this into something human-readable, especially for pattern-based matches like uniqueId.

         We also need to break it down by field so that we can show feedback in-context;
         */
        var saneErrors = {};

        errors.forEach(function(error){
            // Errors with fields that contain data are already associated with the field based on the path
            var field = error.path.replace("#/","");

            // Document-level failures about missing fields need to associated with the field based on the params
            if (error.code === "OBJECT_MISSING_REQUIRED_PROPERTY") { field = error.params[0]; }

            // We could have multiple validation errors for a single field, so we need to allow arrays
            if (!saneErrors[field]) { saneErrors[field]=[];}
            saneErrors[field].push(error.message);
        });

        return saneErrors;
    };

    return helper;
};
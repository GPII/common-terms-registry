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
        var schemaUrl = config.base.url + "/schema/" + key + ".json";

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
        // TODO:  Unpack the format and clean it up
        return errors;
    };

    return helper;
};
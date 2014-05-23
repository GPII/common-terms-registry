"use strict";
// Utility functions for common sanity checks
var Validator = require('jsonschema').Validator;
var validator = new Validator();

// Cache JSON Schemas for all record types for use in isSaneRecord()
var schemaFiles = {
    "term": "term.json",
    "transform": "transform.json",
    "translation": "translation.json",
    "operator": "operator.json",
    "alias": "alias.json",
    "record": "record.json"
};

var schemas = {};

Object.keys(schemaFiles).forEach(function(key){
    var schemaKey = schemaFiles[key];
    var schema = require("../../../public/schema/" + schemaKey);
    schemas[key] = schema;
    validator.addSchema(schema,schemaKey);
});


module.exports.isSaneRecord = function isSaneRecord(record) {
    if (!record) { return false; }
    if (!record.type) { return false; }

    // TODO: We cannot validate records that extend the common record type at the moment because of errors in referencing
//    var schema = schemas[record.type.toLowerCase()];

    var schema = schemas["record"];
    if (!schema) {
        console.log("Could not find schema data for type '" + record.type + "'...");
        return false;
    }
    try {
        var validationOutput = validator.validate(record, schema);

        if (validationOutput && validationOutput.errors && validationOutput.errors.length > 0) {
            console.log("Record failed validation: " + JSON.stringify(validationOutput.errors));
            return false;
        }
    }
    catch (e) {
        debugger;
        console.log(e);
        return false;
    }

    return true;
};

module.exports.isSaneResponse = function isSaneResponse(jqUnit, error, response, body) {
    jqUnit.assertNull("No errors should be returned...",error);
    jqUnit.assertNotNull("A response should be returned...",response);
    jqUnit.assertNotNull("The request should include a return code...", response.statusCode);
    jqUnit.assertNotNull("A body should be returned...", body);

    var jsonData = JSON.parse(body);
    jqUnit.assertNotNull("The 'ok' variable should always be set...", jsonData.ok);
};
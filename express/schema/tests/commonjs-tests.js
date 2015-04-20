// Confirm that all tests still run when using the schema helper's old syntax.
//
// TODO:  Remove this once all code is converted to Fluid components.
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ctr.schemas.tests";
var schemas   = fluid.registerNamespace(namespace);

var loader     = require("../../configs/lib/config-loader");
schemas.config = loader.loadConfig(require("../../configs/express/test"));
schemas.helper = require("../lib/schema-helper")(schemas.config);

// We use z-schema directly to validate our schemas independently of the helper library
var ZSchema   = require("z-schema");
var options   = { noExtraKeywords: true };

schemas.runTests = function() {
    var jqUnit = fluid.require("jqUnit");
    var schemaContents = {};
    schemas.config.schemas.names.forEach(function(schemaName){
        var schemaContent = require("../schemas/" + schemaName + ".json");
        schemaContents[schemaName] = schemaContent;
    });

    jqUnit.module("Schema Tests...");
    jqUnit.test("Validating schemas...", function() {
        var validator = new ZSchema(options);
        var valid = validator.validateSchema(Object.keys(schemaContents).map(function(v) { return schemaContents[v]; }));
        var err   = validator.getLastErrors();

        jqUnit.assertTrue("Schema validation should have completed successfully.", valid);
        jqUnit.assertUndefined("There should have been no validation errors returned:" + JSON.stringify(err), err);
    });

    jqUnit.module("Testing invalid records...");
    schemas.config.schemas.names.forEach(function(schemaName){
        var testRecords = require("./data/" + schemaName + "/invalid.json");

        Object.keys(testRecords).forEach(function(key){
            jqUnit.test("Testing schema '" + schemaName + "' with invalid record '" + key + "'...", function() {
                var errors = schemas.helper.validate(schemaName,testRecords[key]);

                jqUnit.assertValue("Validation should have failed for record '" + key + "'.", errors);
            });
        });
    });

    jqUnit.module("Testing valid records...");
    schemas.config.schemas.names.forEach(function(schemaName){
        var testRecords = require("./data/" + schemaName + "/valid.json");

        Object.keys(testRecords).forEach(function(key){
            jqUnit.test("Testing schema '" + schemaName + "' with valid record '" + key + "'...", function() {
                var errors = schemas.helper.validate(schemaName,testRecords[key]);

                jqUnit.assertUndefined("Validation errors returned for record '" + key + "':\n" + JSON.stringify(errors), errors);
            });
        });
    });
};

schemas.runTests();
// Test JSON Schema validation and user feedback.
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ctr.schemas.tests";
var schemas   = fluid.registerNamespace(namespace);
var fs = require('fs');

// We use z-schema to validate the schemas themselves
var ZSchema   = require("z-schema");
var options   = {
    noExtraKeywords: true
};

schemas.schemaNames = [
    "record",
    "alias",
    "condition",
    "message",
    "records",
    "search",
    "term",
    "transform",
    "translation"
];

schemas.runTests = function() {
    // Make sure the validator is aware of all the references we plan to use by preloading them
//    schemas.schemaNames.forEach(function(schemaName){
//
//    });


    var jqUnit = fluid.require("jqUnit");
    var schemaContents = {};
    schemas.schemaNames.forEach(function(schemaName){
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
    schemas.schemaNames.forEach(function(schemaName){
        var testRecords = require("./data/" + schemaName + "/invalid.json");

        Object.keys(testRecords).forEach(function(key){
            jqUnit.test("Testing schema '" + schemaName + "' with invalid record '" + key + "'...", function() {
                var validator = new ZSchema(options);
                validator.validateSchema(Object.keys(schemaContents).map(function(v) { return schemaContents[v]; }));

                var valid = validator.validate(testRecords[key], schemaContents[schemaName]);
                var err   = validator.getLastErrors();

                jqUnit.assertFalse("Validation should have failed for record '" + key + "'.", valid);
                jqUnit.assertTrue("There should have been one or more errors returned.", err && (err.length > 0));
            });
        });
    });

    jqUnit.module("Testing valid records...");
    schemas.schemaNames.forEach(function(schemaName){
        var testRecords = require("./data/" + schemaName + "/valid.json");

        Object.keys(testRecords).forEach(function(key){
            jqUnit.test("Testing schema '" + schemaName + "' with valid record '" + key + "'...", function() {
                var validator = new ZSchema(options);
                validator.validateSchema(Object.keys(schemaContents).map(function(v) { return schemaContents[v]; }));

                var valid = validator.validate(testRecords[key], schemaContents[schemaName]);
                var err   = validator.getLastErrors();

                jqUnit.assertTrue("Validation should not have failed for record '" + key + "'.", valid);
                jqUnit.assertUndefined("Errors were returned: " + JSON.stringify(err), err);
            });
        });
    });
};

schemas.runTests();
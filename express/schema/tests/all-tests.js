// Test JSON Schema validation and user feedback.
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../lib/schema-helper");

var jqUnit = fluid.require("jqUnit");

fluid.registerNamespace("gpii.schemas.tests");
gpii.schemas.tests.runTests = function(helper) {
    jqUnit.module("Sanity checking module startup...");
    jqUnit.test("Confirming that schemas exist...", function() {
        jqUnit.assertNotUndefined("There should be schema data", helper.options.schemas);
    });
    jqUnit.test("Confirming that schemas are cached properly...", function() {
        jqUnit.assertNotUndefined("The cache should exist", helper.cache);
        jqUnit.assertTrue("The cache should have data", Object.keys(helper.cache).length > 0);
    });

    jqUnit.module("Testing invalid records...");
    fluid.each(helper.options.schemas, function (_, schemaName) {
        var testRecords = require("./data/" + schemaName + "/invalid.json");

        Object.keys(testRecords).forEach(function(key){
            jqUnit.test("Testing schema '" + schemaName + "' with invalid record '" + key + "'...", function() {
                var errors = helper.validate(schemaName, testRecords[key]);

                jqUnit.assertValue("Validation should have failed for record '" + key + "'.", errors);
            });
        });
    });

    jqUnit.module("Testing valid records...");
    fluid.each(helper.options.schemas, function (_, schemaName) {
        var testRecords = require("./data/" + schemaName + "/valid.json");

        Object.keys(testRecords).forEach(function(key){
            jqUnit.test("Testing schema '" + schemaName + "' with valid record '" + key + "'...", function() {
                var errors = helper.validate(schemaName, testRecords[key]);

                jqUnit.assertUndefined("Validation errors returned for record '" + key + "':\n" + JSON.stringify(errors), errors);
            });
        });
    });
};

fluid.defaults("gpii.schemas.tests", {
    gradeNames: ["fluid.eventedComponent", "autoInit"],
    components: {
        helper: {
            type: "gpii.schema.helper",
            options: {
                listeners: {
                    "onSchemasCached": {
                        funcName: "gpii.schemas.tests.runTests",
                        args:     ["{that}"]
                    }
                }
            }
        }
    }
});

gpii.schemas.tests();
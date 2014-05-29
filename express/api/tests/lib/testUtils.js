// Utility functions for common sanity checks in unit tests
"use strict";

module.exports = function(config) {
    var fluid = require('infusion');
    var testUtils = fluid.registerNamespace("gpii.ctr.api.tests.testUtils");

    testUtils.isSaneRecord = function isSaneRecord(jqUnit, record) {
        jqUnit.assertNotNull("Record should not be null...", record);

        if (record) {
            jqUnit.assertNotNull("Record type should not be null...", record.type);

            if (record.type) {
                // TODO: We cannot validate records that extend the common record type at the moment because of errors in referencing
                //    var schema = schemas[record.type.toLowerCase()];

                // TODO: validate against the full record type with information pulled from the config object
                var schema = require("../../../schema/" + "record");
                jqUnit.assertNotNull("There should be schema data for the record type (" + record.type + ")...", schema);

                try {
                    var Validator = require('jsonschema').Validator;
                    var validator = new Validator();
                    var validationOutput = validator.validate(record, schema);
                    if (validationOutput) {
                        jqUnit.assertFalse("There should not be any validation errors...", validationOutput.errors && validationOutput.errors.length > 0);
                    }
                }
                catch(e) {
                    jqUnit.fail("Validation threw errors:" + e.toString());
                }
            }
        }
    };

    testUtils.isSaneResponse = function isSaneResponse(jqUnit, error, response, body) {
        jqUnit.assertNull("No errors should be returned...",error);
        jqUnit.assertNotNull("A response should be returned...",response);
        jqUnit.assertNotNull("The request should include a return code...", response.statusCode);
        jqUnit.assertNotNull("A body should be returned...", body);

        // Additions in support of associating JSON Schemas with all results
        var contentTypeHeader = response.headers["content-type"];
        jqUnit.assertNotNull("A response should have a 'Content-Type' header...", contentTypeHeader);
        if (contentTypeHeader) {
            jqUnit.assertTrue("The 'Content-Type' header should contain a 'profile' link...", contentTypeHeader.indexOf("profile") !== -1);
            jqUnit.assertTrue("The 'Content-Type' header should follow the 'type+json' pattern...", contentTypeHeader.indexOf("+json") !== -1);
        }

        var linkHeader = response.headers.link;
        jqUnit.assertNotNull("A response should have a 'Link' header...", linkHeader);
        if (linkHeader) {
            jqUnit.assertTrue("The 'Link' header should contain a URL...", linkHeader.indexOf("http") !== -1);
            jqUnit.assertTrue("The 'Link' header should indicate that the link describes the record format...", linkHeader.indexOf("describedBy") !== -1);
        }

        var jsonData = JSON.parse(body);
        jqUnit.assertNotNull("The 'ok' variable should always be set...", jsonData.ok);
    };

    return testUtils;
};



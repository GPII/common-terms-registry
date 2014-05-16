"use strict";
// Utility functions for common sanity checks
module.exports.isSaneRecord = function isSaneRecord(record) {
    if (!record) { return false; }

    var requiredFields = ["uniqueId","type","status"];
    requiredFields.forEach(function(field) {
        if (!record[field]) {
            return false;
        }
    });

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
"use strict";
module.exports = function(config) {
    var fluid = require('infusion');
    var helper = fluid.registerNamespace("gpii.ctr.schema.helper");

    helper.setHeaders = function setHeaders (res, key) {
        var schemaUrl = config.schemaUrls[key.toLowerCase()];
        if (!schemaUrl) { console.error("Could not find schema configuration for key '" + key + "'.  Please check your configuration."); }

        if (res.headersSent) {
            console.error("Can't set headers, they have already been sent.");
        }
        else {
            res.set('Content-Type', 'application/' + key + '+json; profile=' + schemaUrl);
            res.set('Link', schemaUrl + '#; rel="describedBy"');
        }
    };

    return helper;
};
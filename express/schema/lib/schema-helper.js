"use strict";
module.exports = function(config) {
    var fluid = require('infusion');
    var helper = fluid.registerNamespace("gpii.ctr.schema.helper");

    helper.setHeaders = function setHeaders (res, key) {
        var schemaUrl = config.schemaUrls[key];
        if (!schemaUrl) { console.error("Could not find schema configuration for key '" + key + "'.  Please check your configuration."); }

        res.set('Content-Type', 'application/' + key + '+json; profile=' + schemaUrl);
        res.set('Link', schemaUrl + '#; rel="describedBy"');
    };

    return helper;
};
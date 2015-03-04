/* Library to add key helper functions to express handlebars */
module.exports = function(config) {
    "use strict";
    var fluid = require('infusion');
    var helper = fluid.registerNamespace("gpii.ctr.lib.hbHelper");

    // TODO:  We need a clean way to include these from both the client and server side, they are duplicated for now...
    helper.jsonify = function(context) { return JSON.stringify(context); };

    helper.getHelpers = function() {
        return {
            jsonify: helper.jsonify
        };
    };

    return helper;
};


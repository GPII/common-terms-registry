"use strict";

// utility function to overlay environmental settings on the defaults
exports.loadConfig = function(config) {
    var _ = require('underscore-node');
    return _.defaults(config, require("../express/defaults.json"));
};
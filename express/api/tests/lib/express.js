// Utility functions to spin up express.
"use strict";

module.exports = function(config) {
    var fluid = require('infusion');
    var express = fluid.registerNamespace("gpii.ctr.api.tests.express");
    express.express = require('express');
    express.app = express.express();
    express.app.set('port', config.port);

    express.start = function(callback) {
        var http = require("http");
        http.createServer(express.app).listen(express.app.get('port'), function(){
            console.log('Express server listening on port ' + express.app.get('port'));

            console.log("Express started...");

            if (callback) {
                callback();
            }
        });
    };

    return express;
};



// Utility functions to spin up express.
"use strict";

module.exports = function(config) {
    var fluid = require('infusion');
    var express = fluid.registerNamespace("gpii.ctr.api.tests.express");
    express.express = require('express');
    express.app = express.express();
    express.app.set('port', config.port);

    // These are required for all permission checks and user management calls
    var cookieParser = require('cookie-parser');
    express.app.use(cookieParser()); // Required for session storage, must be called before session()
    var session = require('express-session');
    express.app.use(session({ secret: config.session.secret}));


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



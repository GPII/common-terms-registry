// Mocked implementation of couch's _session functionality.
"use strict";

module.exports = function(config) {
    var express = require('express');

    var router = express.Router();
    var bodyParser = require('body-parser');
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded());

    // Everyone is always already logged in
    router.get("/",function(req,res) {
        res.status(200).send({"ok":true,"userCtx":{"name":"admin","roles":["_admin","admin"]},"info":{"authentication_db":"_users","authentication_handlers":["oauth","cookie","default"],"authenticated":"cookie"}});
    });

    // Every login is successful
    router.post("/",function(req,res) {
        res.cookie('AuthSession',"",{"path":"/", "httpOnly":true});
        res.status(200).send({"ok":true,"name": req.body.name, "roles":["_admin","admin"]});
    });

    // Every delete is silently ignored
    router.delete("/", function(req,res) {
        res.status(200).send({"ok":true});
    });


    return router;
};



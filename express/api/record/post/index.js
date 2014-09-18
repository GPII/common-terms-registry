"use strict";

// handle all POST calls for /api/records
module.exports = function(config) {
    var fluid = require('infusion');

    var schemaHelper = require("../../../schema/lib/schema-helper")(config);
    var namespace = "gpii.ctr.record.post";

    var record = fluid.registerNamespace(namespace);
    record.error = require("../../lib/error")(config);

    var express = require('express');
    var router = express.Router();

    var bodyParser = require('body-parser');
    router.use(bodyParser.urlencoded());
    router.use(bodyParser.json());

    var postHelper = require("./post-helper")(config);

    router.post('/', postHelper);

    return router;
};

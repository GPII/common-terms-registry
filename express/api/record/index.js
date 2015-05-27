"use strict";

// All handlers for /api/record
module.exports = function (config) {
    var express = require("express");

    var router = express.Router();

    var get = require("./get")(config);
    router.get("/:uniqueId", get);

    var put = require("./put")(config);
    router.use("/", put);

    var post = require("./post")(config);
    router.use("/", post);

    var del = require("./delete")(config);
    router.use("/", del);

    return router;
};

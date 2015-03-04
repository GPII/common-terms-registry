"use strict";
module.exports = function(config) {
    var express = require('express');
    var router = express.Router();

    var dupes = require('./list-dupes')(config);
    router.use('/list-dupes', dupes);

    var aliases = require('./namespace-dupe-aliases')(config);
    router.use('/namespace-dupe-aliases', aliases);

    var deleted = require('./purge-deleted-dupes')(config);
    router.use('/purge-deleted-dupes', deleted);

    return router;
};


/* A simple wrapper to handle the second part of the password reset process...  */
module.exports = function(config) {
    "use strict";
    var express = require('express');
    var router = express.Router();
    var data = require ('../lib/data-helper')(config);

    router.get("/:code", function(req,res) {
        var options = {};
        if (!req.params.code) {
            options.message = "You must provide a password reset code.";
            res.render('pages/error', options);
        }

        options.code = req.params.code;
        res.render('pages/reset', options);
    });

    return router;
};


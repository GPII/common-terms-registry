/* A simple wrapper to pass along calls to the user verification API and display the results returned...  */
module.exports = function(config) {
    "use strict";
    var express = require('express');
    var router = express.Router();
    var data = require ('../lib/data-helper')(config);

    router.get("/:code", function(req,res) {
        if (!req.params.code) {
            options.message = "You must provide a verification code.";
            res.render('pages/error', options);
        }

        var request = require('request');
        var options = {
            url:    config.app.privateUrl + "/api/user/verify/" + req.params.code,
            json:   true,
            config: { "baseUrl": config["base.url"] }
        };
        request.get(options, function(e,r,b){
            if (e) {
                return res.status(500).render("pages/error",{ message: e });
            }

            if (b && b.ok) {
                return res.status(200).render('pages/success', { message: b.message });
            }

            return res.status(500).render("pages/error", { message: b.message });
       });
    });

    return router;
};


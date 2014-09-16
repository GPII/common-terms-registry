/* The "details" view, which functions as both the view and edit interface for individual records. */
module.exports = function(config) {
    "use strict";
    var express = require('express');
    var router = express.Router();
    var data = require ('../lib/data-helper')(config);

    router.get("/:uniqueId", function(req,res) {
        var options = { user: req.session.user};
        data.exposeRequestData(req,options);

        if (req.params.uniqueId === "new") {
            if (req.session.user) {
                // Use the record defaults from our configuration
                var record = config["record.defaults"];

                // Add support for prepopulating the link to the parent record for aliases, translations, etc. using query variables
                var fieldsToPrepopulate = ["aliasOf","translationOf", "type"];
                fieldsToPrepopulate.forEach(function(field){
                    if (req.query[field]) {
                        record[field] = req.query[field];
                    }
                });

                options.layout = 'details';
                options.record = record;
                res.render('pages/details', options);
            }
            else {
                options.message = "You must be logged in to create new records.";
                res.render('pages/error', options);
            }
        }
        else {
            options.layout = 'details';
            options.record = { uniqueId: req.params.uniqueId };
            res.render('pages/details', options);
        }
    });

    return router;
};


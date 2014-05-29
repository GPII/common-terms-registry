"use strict";

module.exports = function(config) {
    var fluid = require('infusion');

    var namespace = "gpii.ctr.record";
    var record = fluid.registerNamespace(namespace);
    var request = require('request');

    record.parseAndValidateInput = function() {
        if (!record.req.params || !record.req.params.uniqueId) {
            throw record.constructError(400,"You must provide the required query parameters to use this interface.");
        }
    };

    // TODO:  create a library where we reuse patterns like this
    record.constructError = function(status, message) {
        var error = new Error(message);
        error.status = status;
        error.ok = false;
        return error;
    };

    var express = require('express');

    var router = express.Router();
    router.get('/:uniqueId', function(req, res){
        // per-request variables need to be defined here, otherwise (for example) the results of the previous search will be returned if the next search has no records
        record.req = req;
        record.res = res;

        // TODO:  Pull this from the configuration so that the URLs, etc. can be defined for both testing and production
        res.set('Content-Type', 'application/message+json; profile=https://terms.raisingthefloor.org/schema/message.json');
        res.set('Link', 'https://terms.raisingthefloor.org/schema/message.json#; rel="describedBy"');

        record.results = {
            "ok": true,
            "retrievedAt": new Date()
        };

        // Server config validation
        if (!config || !config['couch.url']) {
            var message = "Your instance is not configured correctly to enable record lookup.  You must have a couch.url variable configured.";
            console.log(message);
            return res.send(500,JSON.stringify({ ok:false, message: message }));
        }

        // User input validation
        try {
            record.parseAndValidateInput();
        }
        catch(err) {
            return res.send(err.status ? err.status : 500, JSON.stringify(err));
        }

        // Get the record from couch
        request.get(config['couch.url'] + "/_design/app/_view/entries?keys=%5B%22" + record.req.params.uniqueId + "%22%5D", function(e,r,b) {
            if (e) { return res.send(500,JSON.stringify({ok: false, message: "Error retrieving record from couchdb", error: e}));}

            var jsonData = JSON.parse(b);
            if (!jsonData.rows || jsonData.rows.length === 0) {
                return res.send(404,JSON.stringify({ok:false, message: "Record not found." }));
            }
            else {
                // TODO:  Generalize this to the specific record type returned
                res.set('Content-Type', 'application/record+json; profile=https://terms.raisingthefloor.org/schema/record.json#');
                res.set('Link', 'https://terms.raisingthefloor.org/schema/search.json#; rel="describedBy"');
                record.results.record = jsonData.rows[0].value;
                res.send(200, JSON.stringify(record.results));
            }
        });
    });

    // TODO:  Add Create REST end point (POST /api/record)

    // TODO:  Add Update REST end point (PUT /api/record)

    // TODO:  Add Delete REST end point (DELETE /api/record/{id})


    router.get("/", function(req,res) {
        // TODO:  Pull this from the configuration so that the URLs, etc. can be defined for both testing and production
        res.set('Content-Type', 'application/message+json; profile=https://terms.raisingthefloor.org/schema/message.json');
        res.set('Link', 'https://terms.raisingthefloor.org/schema/message.json#; rel="describedBy"');

        return res.send(400,{ok: false, message: "You must provide the required uniqueId in the path to use this interface."});
    });

    return router;
};

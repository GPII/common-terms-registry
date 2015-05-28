// Detect duplicates and provide output to fix one variation on the problem, namely aliases whose uniqueIDs collide with each other.
"use strict";
module.exports = function(config) {
    var express = require('express');
    var router = express.Router();

    router.get("/", function(req,res) {
        var request = require("request");

        // Get the full list of unfiltered records from couch
        request.get(config['couch.url'] + "/_all_docs?include_docs=true", function(e,r,b) {
            if (e) {
                return res.send(500,{ "ok": "false", "message": "Error retrieving data from couch...", "error": e});
            }

            var data = JSON.parse(b);
            if (!data.rows) {
                return res.send(500,{ "ok": "false", "message": "No data was returned from couch..."});
            }


            // Page through and keep two maps by uniqueID, one of distinct scanned uniqueIDs, and one of dupes
            var firsts = {};
            var dupes = {};

            data.rows.forEach(function(row) {
                var doc = row.doc;
                if (row.id.indexOf("_design") === -1 && doc && doc.uniqueId) {
                    var newDoc = doc;
                    if (doc.type !== "term") {
                        newDoc = JSON.parse(JSON.stringify(doc));
                        newDoc.uniqueId = doc.source + ":" + doc.uniqueId;
                    }

                    if (!firsts[doc.uniqueId]) {
                        firsts[doc.uniqueId] = newDoc;
                    }
                    else {
                        if (dupes[doc.uniqueId]) {
                            dupes[doc.uniqueId].push(newDoc);
                        }
                        else {
                            dupes[doc.uniqueId] = [firsts[doc.uniqueId], newDoc];
                        }
                    }

                }
            });

            // Present the list of duplicates
            var docs = [];
            Object.keys(dupes).map(function(key){ dupes[key].forEach(function(value){ docs.push(value);});});
            res.send(200, {"message": "This output is designed to be fed into CouchDB's bulk document interface, duplicate IDs for aliases are qualified using their source.", "docs": docs });
        });
    });

    return router;
};


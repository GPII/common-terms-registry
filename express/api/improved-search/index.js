module.exports = function(config) {
    var express = require('express');
    return express.Router().get('/', function(req, res){
        // Server config validation
        if (!config || !config['couch.url'] || !config['lucene.url']) {
            var message = "Your instance is not configured correctly to enable searching.  You must have a couch.url and lucene.url variable configured.";
            console.log(message);
            return res.send(500,JSON.stringify({ ok:false, message: message }));
        }

        // Support a "quick" mode in which paging is disabled and only the top results are returns (used for auto-suggest, etc.)
        var quick = config.lookup ? true : false;

        // User input validation
        res.set('Content-Type', 'application/json');
        if (!req.query || !req.query.q) { return res.send(400, JSON.stringify({ok: false, message: 'A search string is required.'})); }

        if (quick && (req.query.offset || req.query.limit)) {
            return res.send(400, JSON.stringify({ok: false, message: 'Paging parameters (limit, offset) are not allowed when using the quick search.'}));
        }

        var distinctUniqueIds = [];
        var termHash = {};

        var results = {};
        results.q = req.query.q;
        if (quick) {
            results.offset = 0;
            // config.quickResults can be used to increase the page size for "quick" searches
            results.limit  = config.quickResults ? config.quickResults : 25;
        }
        else {
            results.offset = req.query.offset ? parseInt(req.query.offset) : 0;
            results.limit  = req.query.limit ? parseInt(req.query.limit) : 100;
        }

        results.retrievedAt = new Date();

        var queryString = "";
        var fields = ["q","sort"];
        for (var i in fields) {
            var field = fields[i];
            if (req.query[field]) {
                if (queryString.length > 0) { queryString += '&'; }

                if (req.query[field] instanceof Array) {
                    queryString += field + "=" + req.query[field].join('&'+field+'=');
                }
                else {
                    queryString += field + "=" + req.query[field];
                }
            }
        }

        var searchOptions = {
            "url" : config['lucene.url'] + "?" + queryString,
            "json": true
        };

        // Perform the search
        var request = require('request');
        request.get(searchOptions, function (error, response, body) {
            if (error) { return res.send(500, JSON.stringify(error)); }

            if (body && body.rows) {
                // build a list of unique term IDs, skipping duplicates.
                for (var i = 0; i < body.rows.length; i++) {
                    var record = body.rows[i].fields;
                    var uniqueId = record.uniqueId;

                    if (record.type === "ALIAS" || record.type === "TRANSFORMATION") {
                        uniqueId = record.aliasOf;
                    }
                    else if (record.type === "TRANSLATION") {
                        uniqueId = record.translationOf;
                    }

                    if (distinctUniqueIds.indexOf(uniqueId) == -1) {
                        distinctUniqueIds.push(uniqueId);
                    }
                }
            }

            if (distinctUniqueIds.length === 0) {
                results.ok = true;
                results.total_rows = 0;
                results.records = {};

                return res.send(200, JSON.stringify(results));
            }

            // Retrieve the parent records via /tr/_design/app/_view/entries?keys=
            var parentRecordOptions = {
                "url" : config['couch.url'] + "/_design/app/_view/entries?keys=" + JSON.stringify(distinctUniqueIds),
                "json": true
            };

            request.get(parentRecordOptions, function (error, response, body) {
                if (error) { return res.send(500, JSON.stringify(error)); }

                // Add them to the list in process.
                for (var i = 0; i < body.rows.length; i++) {
                    var record = body.rows[i].value;
                    if (record.type === "GENERAL") termHash[record.uniqueId] = record;
                }

                // retrieve the child records via /tr/_design/app/_view/children?keys=
                var childRecordOptions = {
                    "url" : config['couch.url'] + "/_design/app/_view/children?keys=" + JSON.stringify(distinctUniqueIds),
                    "json": true
                };

                request.get(childRecordOptions, function (error, response, body) {
                    if (error) { return res.send(500, JSON.stringify(error)); }

                    for (var i = 0; i < body.rows.length; i++) {
                        var record = body.rows[i].value;
                        var parentId = record.aliasOf;
                        if (record.type === "TRANSLATION") { parentId = record.translationOf; }
                        var parentRecord = termHash[parentId];
                        if (parentRecord) {
                            var arrayName = "children";

                            if (record.type === "ALIAS") { arrayName = "aliases"; }
                            else if (record.type === "TRANSFORMATION") { arrayName = "transformations"; }
                            else if (record.type === "TRANSLATION") { arrayName = "translations"; }

                            if (!parentRecord[arrayName]) { parentRecord[arrayName] = []; }
                            parentRecord[arrayName].push(record);
                        }
                        else {
                            console.error("Something is hugely wrong, I got a child record ('" + record.uniqueId + "') without a corresponding parent ('" + parentId + "').");
                        }
                    }

                    var records = Object.keys(termHash).map(function(key) { return termHash[key]; });

                    results.ok = true;
                    results.total_rows = records.length;

                    if (req.query.sort) { results.sort = req.query.sort; }

                    results.records = records.slice(results.offset, results.offset + results.limit);

                    res.send(200, JSON.stringify(results));
                });
            });
        });
    });
};

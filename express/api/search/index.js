"use strict";

module.exports = function(config) {
    var schemaHelper = require("../../schema/lib/schema-helper")(config);
    var fluid = require('infusion');

    var quick = config.lookup ? true : false;
    var search = fluid.registerNamespace(quick ? "gpii.ctr.api.suggest" : "gpii.ctr.api.search");

    var request = require('request');

    // TODO:  Move child record lookup to a common helper module, as we will need it for the search as well as /api/records and /api/record
    search.getChildRecords = function (error, response, body) {
        if (error) { return search.res.send(500, JSON.stringify(error)); }

        for (var i = 0; i < body.rows.length; i++) {
            var record = body.rows[i].value;
            var parentId = record.aliasOf;
            if (record.type === "TRANSLATION") { parentId = record.translationOf; }
            var parentRecord = search.termHash[parentId];
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

        var records = Object.keys(search.termHash).map(function(key) { return search.termHash[key]; });

        search.results.ok = true;
        search.results.total_rows = records.length;

        if (search.req.query.sort) { search.results.sort = search.req.query.sort; }

        search.results.records = records.slice(search.results.offset, search.results.offset + search.results.limit);

        schemaHelper.setHeaders(search.res, "search");
        return search.res.send(200, JSON.stringify(search.results));
    };

    search.getParentRecords = function (error, response, body) {
        if (error) { return search.res.send(500, JSON.stringify(error)); }

        // Add them to the list in process.
        for (var i = 0; i < body.rows.length; i++) {
            var record = body.rows[i].value;
            if (record.type === "GENERAL") {
                search.termHash[record.uniqueId] = record;
            }
        }

        // retrieve the child records via /tr/_design/app/_view/children?keys=
        var childRecordOptions = {
            "url" : config['couch.url'] + "/_design/app/_view/children?keys=" + JSON.stringify(search.distinctUniqueIds),
            "json": true
        };

        request.get(childRecordOptions, search.getChildRecords);
    };

    search.getLuceneSearchResults = function (error, response, body) {
        if (error) { return search.res.send(500, JSON.stringify(error)); }

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

                if (search.distinctUniqueIds.indexOf(uniqueId) === -1) {
                    search.distinctUniqueIds.push(uniqueId);
                }
            }
        }

        if (search.distinctUniqueIds.length === 0) {
            search.results.ok = true;
            search.results.total_rows = 0;
            search.results.records = {};

            schemaHelper.setHeaders(search.res, "search");
            return search.res.send(200, JSON.stringify(search.results));
        }

        // Retrieve the parent records via /tr/_design/app/_view/entries?keys=
        var parentRecordOptions = {
            "url" : config['couch.url'] + "/_design/app/_view/entries?keys=" + JSON.stringify(search.distinctUniqueIds),
            "json": true
        };

        request.get(parentRecordOptions, search.getParentRecords);
    };

    var express = require('express');
    return express.Router().get('/', function(req, res){
        schemaHelper.setHeaders(res, "message");

        // per-request variables need to be defined here, otherwise (for example) the results of the previous search will be returned if the next search has no records
        search.distinctUniqueIds = [];
        search.termHash          = {};
        search.results           = {};

        search.req = req;
        search.res = res;

        // Server config validation
        if (!config || !config['couch.url'] || !config['lucene.url']) {
            var message = "Your instance is not configured correctly to enable searching.  You must have a couch.url and lucene.url variable configured.";
            console.log(message);
            return res.send(500,JSON.stringify({ ok:false, message: message }));
        }

        // Support a "quick" mode in which paging is disabled and only the top results are returns (used for auto-suggest, etc.)
        var quick = config.lookup ? true : false;

        // User input validation
        if (!req.query || !req.query.q) { return res.send(400, JSON.stringify({ok: false, message: 'A search string is required.'})); }

        if (quick && (req.query.offset || req.query.limit)) {
            return res.send(400, JSON.stringify({ok: false, message: 'Paging parameters (limit, offset) are not allowed when using the quick search.'}));
        }

        // TODO:  Add support for displaying versions

        search.results.q = req.query.q;
        if (quick) {
            search.results.offset = 0;
            // config.quickResults can be used to increase the page size for "quick" searches
            search.results.limit  = config.quickResults ? config.quickResults : 25;
        }
        else {
            search.results.offset = req.query.offset ? parseInt(req.query.offset) : 0;
            search.results.limit  = req.query.limit ? parseInt(req.query.limit) : 100;
        }

        search.results.retrievedAt = new Date();

        var queryString = "";
        var fields = ["q","sort"];
        fields.forEach(function (field) {
            if (req.query[field]) {
                if (queryString.length > 0) {
                    queryString += '&';
                }

                if (req.query[field] instanceof Array) {
                    req.query[field].forEach(function(entry) {
                        if (queryString.length > 0) {
                            queryString += '&';
                        }
                        queryString += field + "=" + encodeURIComponent(entry);
                    });
                }
                else {
                    queryString += field + "=" + encodeURIComponent(req.query[field]);
                }
            }
        });

        var searchOptions = {
            "url" : config['lucene.url'] + "?" + queryString,
            "json": true
        };

        // Perform the search
        request.get(searchOptions, search.getLuceneSearchResults);
    });
};

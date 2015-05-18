"use strict";

// TODO:  The "suggest" module should just be an instance of this grade with particular options set.

// TODO:  As with records, we should filter, sort, then page
// TODO:  We must sort while we still have the raw search results, otherwise we don't have the option to sort by the relevance.

module.exports = function (config) {
    var schemaHelper = require("../../schema/lib/schema-helper")(config);
    var fluid        = require("infusion");
    var paging       = require("../lib/paging")(config);

    var quick        = config.lookup ? true : false;

    // TODO:  We will have to disentangle this and make "suggest" extend "search"
    var search       = fluid.registerNamespace(quick ? "gpii.ctr.api.suggest" : "gpii.ctr.api.search");

    // TODO:  We should not be using variables like this, we should be using options
    search.schema        = "search";
    search.defaultOffset = 0;
    search.defaultLimit  = 250;

    var children     = require("../lib/children")(config, search);
    var request      = require("request");
    var filters      = require("secure-filters");

    // We cannot URI encode colons, as Lucene will not decode them. Everything else we must encode to avoid problems with bad characters.
    search.encodeSkippingColons = function (value) {
        if (!value || typeof value !== "string") {
            return value;
        }

        var segments = value.split(":");
        var encodedSegments = segments.map(encodeURIComponent);

        return encodedSegments.join(":");
    };

    // Process the raw search results returned by Lucene and derive the list of distinct terms.
    search.processLuceneSearchResults = function (error, response, body) {
        if (error) { return search.res.status(500).send(JSON.stringify(error)); }

        search.results.offset = search.params.offset;
        search.results.limit  = search.params.limit;

        if (body && body.rows) {
            // build a list of unique term IDs, skipping duplicates.
            for (var i = 0; i < body.rows.length; i++) {
                var record = body.rows[i].fields;
                var uniqueId = record.uniqueId;

                if (record.type === "alias" || record.type === "transform") {
                    uniqueId = record.aliasOf;
                }
                else if (record.type === "translation") {
                    uniqueId = record.translationOf;
                }

                if (search.distinctUniqueIds.indexOf(uniqueId) === -1) {
                    var sanitizedId = filters.js(uniqueId);
                    search.distinctUniqueIds.push(sanitizedId);
                }
            }
        }

        search.results.total_rows = search.distinctUniqueIds.length;
        if (search.distinctUniqueIds.length === 0) {
            search.results.ok = true;
            search.results.records = {};

            schemaHelper.setHeaders(search.res, "search");
            return search.res.status(200).send(JSON.stringify(search.results));
        }

        // Retrieve the parent records via /tr/_design/api/_view/entries?keys=
        var pagedUniqueIds = paging.pageArray(search.distinctUniqueIds, search.params);
        var distinctKeyString = JSON.stringify(pagedUniqueIds);

        if (distinctKeyString.length > 7500) {
            return search.res.status(500).send({ok: false, message: "Your query returned too many search results to display.  Please add additional search terms or filters."});
        }
        else {
            var parentRecordOptions = {
                "url" : config["couch.url"] + "/_design/api/_view/entries",
                "qs": { keys: distinctKeyString },
                "json": true
            };

            request.get(parentRecordOptions, search.getParentRecords);
        }
    };

    var express = require("express");
    return express.Router().get("/", function (req, res) {
        schemaHelper.setHeaders(res, "message");

        // per-request variables need to be defined here, otherwise (for example) the results of the previous search will be returned if the next search has no records
        search.distinctUniqueIds = [];
        search.results           = {};
        search.params = {};
        search.req = req;
        search.res = res;

        var queryLimit = parseInt(req.query.limit, 10);
        search.params.limit = isNaN(queryLimit) ? search.defaultLimit : queryLimit;

        var queryOffset = parseInt(req.query.offset, 10);
        search.params.offset = isNaN(queryOffset) ? search.defaultOffset : queryOffset;

        // Server config validation
        if (!config || !config["couch.url"] || !config["lucene.url"]) {
            var message = "Your instance is not configured correctly to enable searching.  You must have a couch.url and lucene.url variable configured.";
            console.log(message);
            return res.status(500).send(JSON.stringify({ ok: false, message: message }));
        }

        // Support a "quick" mode in which paging is disabled and only the top results are returns (used for auto-suggest, etc.)
        var quick = config.lookup ? true : false;

        // User input validation
        if (!req.query || !req.query.q) { return res.status(400).send(JSON.stringify({ok: false, message: "A search string is required."})); }

        // TODO:  Add support for displaying versions

        search.results.q = req.query.q;
        search.results.retrievedAt = new Date();

        var field              = "q";
        var queryString        = "";
        var qualifierFieldName = "status";
        var qualifiersFound    =  Boolean(qualifierFieldName && req.query[qualifierFieldName]);
        var qualifierString = "";
        if (qualifiersFound) {
            var qualifierValue = req.query[qualifierFieldName];
            if (qualifierValue instanceof Array) {
                qualifierString += "(" + qualifierFieldName + ":" + qualifierValue.join(" OR " + qualifierFieldName + ":") + ") AND ";
            }
            else {
                qualifierString += qualifierFieldName + ":" + qualifierValue + " AND ";
            }
        }

        if (req.query[field]) {
            if (req.query[field] instanceof Array) {
                req.query[field].forEach(function (entry) {
                    queryString = qualifierString + search.encodeSkippingColons(entry);
                });
            }
            else {
                queryString = qualifierString + search.encodeSkippingColons(req.query[field]);
            }
        }
        else if (qualifiersFound) {
            queryString = qualifierString;
        }

        var queryData = {
            "q":     queryString,
            "limit": 1000000 // Hard-coded limit to disable limiting by Lucene.  Required because of CTR-148
        };

        if (req.query.sort) {
            queryData.sort = req.query.sort;
        }

        var searchOptions = {
            "url" :    config["lucene.url"],
            "qs":      queryData,
            "json":    true,
            "timeout": 10000 // In practice, we probably only need a second, but this is set high to give lucene time to respond.
        };

        // Perform the search
        request.get(searchOptions, search.processLuceneSearchResults);
    });
};

// TODO:  write a "shim" that takes the "config" object and returns our router.
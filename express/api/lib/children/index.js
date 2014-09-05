// Library to add consistent handling of adding child records to parents
//
// When the core functions are run, the library expects for the parent object to contain:
//
// 1. The current response object (res)
// 2. The current request object (req)
// 3. The "results" object that may be returned upstream to the client
// 4. A "filters" object that contains the list of parsed query parameters
// 5. A "schema" parameter that points to the schema that should be used with the results

"use strict";

module.exports = function(config,parent) {
    var schemaHelper = require("../../../schema/lib/schema-helper")(config);
    var paging = require("../../lib/paging")(config);

    var fluid = require('infusion');

    var children = fluid.registerNamespace("gpii.ctr.api.lib.children");
    children.request = require('request');

    function getChildRecords(error, response, body) {
        if (!parent.res || !parent.results || !parent.req || !parent.params || !parent.schema) {
            return console.error("Can't construct child records, parent object lacks the required variables.");
        }

        if (error) { return parent.res.status(500).send(JSON.stringify(error)); }

        for (var i = 0; i < body.rows.length; i++) {
            var record = body.rows[i].value;
            var parentId = record.aliasOf;
            if (record.type === "translation") { parentId = record.translationOf; }
            var parentRecord = children.termHash[parentId];

            // Silently skip orphaned child records, which can show up in the rare cases where we can't exclude them upstream
            if (parentRecord) {
                var arrayName = "children";

                if (record.type === "alias") { arrayName = "aliases"; }
                else if (record.type === "transform") { arrayName = "transformations"; }
                else if (record.type === "translation") { arrayName = "translations"; }

                if (!parentRecord[arrayName]) { parentRecord[arrayName] = []; }
                parentRecord[arrayName].push(record);
            }
        }

        var records = Object.keys(children.termHash).map(function(key) { return children.termHash[key]; });

        parent.results.ok = true;

        if (parent.schema === "record") {
            parent.results.record = records[0];
        }
        else {
            parent.results.total_rows = records.length;

            if (parent.req.query.sort) { parent.results.sort = parent.req.query.sort; }

            parent.results.records = paging.pageArray(records, parent.results);
        }

        schemaHelper.setHeaders(parent.res, parent.schema);
        return parent.res.status(200).send(JSON.stringify(parent.results));
    }

    // Expose the child lookup for use in /api/record
    parent.getChildRecords = getChildRecords;

    // Expose the full lookup for use in /api/records and /api/search
    parent.getParentRecords = function (error, response, body) {
        if (!parent.res || !parent.results || !parent.req || !parent.params || !parent.schema ) {
            return console.error("Can't retrieve parent records to construct children, parent object lacks the required variables.");
        }

        // clear out the existing results
        children.termHash          = {};
        children.distinctIDs       = [];
        children.strippedIDs       = [];
        if (error) { return parent.res.status(500).send(JSON.stringify(error)); }

        if (!body.rows) {
            parent.results.ok = true;

            // TODO:  Something else should process the results more consistently
            if (parent.schema === "record") {
                parent.results.record = {};
            }
            else {
                parent.results.total_rows = 0;
                if (parent.req.query.sort) { parent.results.sort = parent.req.query.sort; }
                parent.results.records = {};
            }

            schemaHelper.setHeaders(parent.res, parent.schema);
            return parent.res.status(200).send(JSON.stringify(parent.results));
        }

        // Add any records returned to the list in process.
        for (var i = 0; i < body.rows.length; i++) {
            var record = body.rows[i].value;
            if (record.type === "term") {

                if ((parent.params.updated && new Date(record.updated) < parent.params.updated) ||
                    (parent.params.statuses && parent.params.statuses.indexOf(record.status.toLowerCase()) === -1) ||
                    (parent.params.recordTypes && parent.params.recordTypes.indexOf(record.type.toLowerCase()) === -1)) {
                    // Exclude this record
                }
                else {
                    children.termHash[record.uniqueId] = record;
                    if (children.distinctIDs.indexOf(record.uniqueId) === -1) {
                        children.distinctIDs.push(record.uniqueId);
                    }
                }
            }
        }

        // we can only pass a limited number of keys in the query (< 8000 bytes of data, roughly), so we have to do a couple of checks to avoid passing too much query data.

        // By default, we don't limit child records by keys.  That means we make a fast call that returns a lot of data and may end up discarding a bunch.
        var queryParams = "";

        // If we have paging parameters, use those...
        if (parent.params.limit !== undefined && parent.params.offset !== undefined) {
            queryParams = "?keys=" + JSON.stringify(children.distinctIDs.slice(parent.params.offset, parent.params.offset + parent.params.limit));
        }
        // If we have few enough records (as is usually the case with a search), just go for it
        else if (children.distinctIDs.length < 75 ) {
            queryParams = "?keys=" + JSON.stringify(children.distinctIDs);
        }

        // retrieve the child records via /tr/_design/api/_view/children?keys=
        var childRecordOptions = {
            "url" : config['couch.url'] + "/_design/api/_view/children" + queryParams,
            "json": true
        };

        children.request.get(childRecordOptions, getChildRecords);
    };

    return children;
};
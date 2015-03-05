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
    var paging       = require("../../lib/paging")(config);
    var fluid        = require('infusion');
    var sorting      = require("../../lib/sorting")(config);

    var filters      = require("secure-filters");

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
        // TODO:  We may be able to move this upstream.
        if (parent.params.sort) {
            sorting.sort(records, parent.params.sort);
        }

        parent.results.ok = true;

        if (parent.schema === "record") {
            parent.results.record = records[0];
        }
        else {
            parent.results.total_rows = records.length;

            if (parent.req.query.sort) { parent.results.sort = parent.req.query.sort; }

            parent.results.records = paging.pageArray(records, parent.results);
        }

        // TODO:  This pattern seems to break things if there are underlying errors and crash the server.  Keep an eye out and investigate once we have more data.
        schemaHelper.setHeaders(parent.res, parent.schema);
        return parent.res.status(200).send(JSON.stringify(parent.results));
    }

    // Expose the child lookup for use in /api/record
    parent.getChildRecords = getChildRecords;

    // Expose the full lookup for use in /api/records and /api/search
    // TODO:  Figure out why this is not sorting correctly...
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
        body.rows.forEach(function(row){
            var record = row.value;
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
        });

        // we can only pass a limited number of keys in the query (< 8000 bytes of data, roughly).
        //
        // If we have more key data than that, we have just get the whole mess of data and discard anything we don't want.
        //
        // We can't slice the data by our paging limits because the records aren't in the right order yet.

        var queryParams = "";

        var sanitizedIds = [];
        children.distinctIDs.forEach(function(id){sanitizedIds.push(filters.js(id));});

        var keyString = JSON.stringify(sanitizedIds);
        var qs = {};
        if (keyString.length > 7500) {
            console.log("Too much key data, will retrieve all results and filter internally.");
        }
        else {
            qs.keys = keyString;
        }

        // retrieve the child records via /tr/_design/api/_view/children?keys=
        var childRecordOptions = {
            "url" : config['couch.url'] + "/_design/api/_view/children",
            "qs":   qs,
            "json": true,
            "timeout": 10000 // In practice, we probably only need a second, but the defaults are definitely too low.
        };

        children.request.get(childRecordOptions, getChildRecords);
    };

    return children;
};
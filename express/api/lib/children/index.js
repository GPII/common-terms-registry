// Library to add consistent handling of adding child records to parents
//
// When the core functions are run, the library expects for the parent object to contain:
//
// 1. The current response object (res)
// 2. The current request object (req)
// 3. The "results" object that may be returned upstream to the client
// 4. A "filters" object that contains the list of parsed query parameters

"use strict";

module.exports = function(config,parent) {
    var schemaHelper = require("../../../schema/lib/schema-helper")(config);

    var fluid = require('infusion');
    var children = fluid.registerNamespace("gpii.ctr.api.lib.children");

    function getChildRecords(error, response, body) {
        if (!parent.res || !parent.results || !parent.req || !parent.filters) {
            return console.error("Can't construct child records, parent object lacks the required variables.");
        }

        if (error) { return parent.res.send(500, JSON.stringify(error)); }

        for (var i = 0; i < body.rows.length; i++) {
            var record = body.rows[i].value;
            var parentId = record.aliasOf;
            if (record.type === "TRANSLATION") { parentId = record.translationOf; }
            var parentRecord = children.termHash[parentId];
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

        var records = Object.keys(children.termHash).map(function(key) { return children.termHash[key]; });

        parent.results.ok = true;
        parent.results.total_rows = records.length;

        if (parent.req.query.sort) { parent.results.sort = parent.req.query.sort; }

        parent.results.records = records.slice(parent.results.offset, parent.results.offset + parent.results.limit);

        schemaHelper.setHeaders(parent.res, "search");
        return parent.res.send(200, JSON.stringify(parent.results));
    }

    parent.getParentRecords = function (error, response, body) {
        if (!parent.res || !parent.results || !parent.req || !parent.filters ) {
            return console.error("Can't retrieve parent records to construct children, parent object lacks the required variables.");
        }

        // clear out the existing results
        children.termHash          = {};
        children.distinctIDs       = [];
        if (error) { return parent.res.send(500, JSON.stringify(error)); }

        // Add them to the list in process.
        for (var i = 0; i < body.rows.length; i++) {
            var record = body.rows[i].value;
            if (record.type === "GENERAL") {
                children.termHash[record.uniqueId] = record;
                if (children.distinctIDs.indexOf(record.uniqueId) === -1) {
                    children.distinctIDs.push(record.uniqueId);
                }
            }
        }

        var queryParams = "";
        if (parent.filters.limit !== undefined && parent.filters.offset !== undefined) {
            queryParams = "?keys=" + JSON.stringify(children.distinctIDs.slice(parent.filters.offset, parent.filters.offset + parent.filters.limit));
        }

        // retrieve the child records via /tr/_design/api/_view/children?keys=
        var childRecordOptions = {
            "url" : config['couch.url'] + "/_design/api/_view/children" + queryParams,
            "json": true
        };

        var request = require('request');
        request.get(childRecordOptions, getChildRecords);
    };

    return children;
};
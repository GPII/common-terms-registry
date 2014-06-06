// Library to add consistent handling of adding child records to parents
"use strict";

module.exports = function(config,parent) {
    var schemaHelper = require("../../../schema/lib/schema-helper")(config);
    parent.getChildRecords = function (error, response, body) {
        if (!parent.res || !parent.results || !parent.req) {
            return console.error("Can't construct child records, parent object lacks the required variables.");
        }

        if (error) { return parent.res.send(500, JSON.stringify(error)); }


        for (var i = 0; i < body.rows.length; i++) {
            var record = body.rows[i].value;
            var parentId = record.aliasOf;
            if (record.type === "TRANSLATION") { parentId = record.translationOf; }
            var parentRecord = parent.termHash[parentId];
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
    
        var records = Object.keys(parent.termHash).map(function(key) { return parent.termHash[key]; });
    
        parent.results.ok = true;
        parent.results.total_rows = records.length;
    
        if (parent.req.query.sort) { parent.results.sort = parent.req.query.sort; }
    
        parent.results.records = records.slice(parent.results.offset, parent.results.offset + parent.results.limit);
    
        schemaHelper.setHeaders(parent.res, "search");
        return parent.res.send(200, JSON.stringify(parent.results));
    };

    // TODO:  Return an object that provides convenience methods for dealing with child objects
};
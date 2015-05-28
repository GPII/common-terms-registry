// Quick and dirty script to extract sample data from a couch instance and clean it up in a few useful ways. To wit:
//
//  1. Clusters of related terms are stripped of their meaningless Couch-isms (_id, _rev, etc.)
//  2. Design documents appear first in the list of records.
//  3. Clusters of related terms appear together in order.
//  4. Only the first 50 clusters are preserved.
//  5. The final structure wraps the records in `{ docs: [ records ] }`.
//
// The final output can be used with both the bulk document interface that CouchDb and Pouch provide.
"use strict";
var request = require("request");
var fs      = require("fs");
var options = {
    url: "http://admin:admin@localhost:5984/tr/_all_docs?include_docs=true"
};

var timestamp = (new Date()).getTime();
var output = "/tmp/records-" + timestamp + ".json";

function getKey(record) {
    if (record.aliasOf) {
        return record.aliasOf;
    }
    if (record.translationOf) {
        return record.aliasOf;
    }
    if (record.uniqueId) {
        return record.uniqueId;
    }
    return record._id;
}

request(options, function (error, response, body) {
    var data = typeof body === "string" ? JSON.parse(body) : body;
    var processedData = data.rows.map(function (row) {
        var record = row.doc;

        if (record._id.indexOf("_design") === 0) {
            return record;
        }
        else {
            var fieldsToDelete = ["_id", "_rev", "source"];
            for (var a = 0; a < fieldsToDelete.length; a++) {
                var field = fieldsToDelete[a];
                if (record[field]) {
                    delete record[field];
                }
            }
            return record;
        }
    });

    // Sort so that design documents come first, then records, ordered by "cluster" and "type"
    processedData.sort(function (a, b) {
        var aKey = getKey(a);
        var bKey = getKey(b);
        if (a._id && !b._id) {
            return -1;
        }
        if (b._id && !a._id) {
            return 1;
        }
        if (aKey === bKey) {
            return 0;
        }
        if (aKey > bKey) {
            return 1;
        }
        if (aKey < bKey) {
            return -1;
        }
    });

    // We only want design documents and the first few sets of records
    var maxClusters = 50;
    var accumulator = {};
    processedData = processedData.filter(function (entry) {
        if (entry._id) { return true; }
        else if (Object.keys(accumulator).length < maxClusters) {
            accumulator[getKey(entry)] = true;
            return true;
        }

        return false;
    });

    fs.writeFile(output, JSON.stringify(processedData, null, 2), {}, function () {
        console.log("Output saved to '" + output + "'...");
    });
});
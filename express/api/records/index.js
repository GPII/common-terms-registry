"use strict";

var fluid = require('infusion');
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.records");

// Bring in our helper components
require("../../schema/lib/schema-helper");

// TODO: Convert to components
var paging       = require("../lib/paging")(config);
var sorting      = require("../lib/sorting")(config);

// TODO:  Wire in the component version
var children = require("../lib/children")(config, records);

var path     = require("path");
var request  = require("request");
var url      = require("url");

gpii.ptd.records.checkRequirements = function(that) {
    if (!that.options.couchUrl) {
        fluid.fail("you must set a couchUrl option in order to use this component.");
    }
    if (!that.options.recordType) {
        fluid.fail("You must set a recordType in your options in order to use this component.");
    }
    if (that.options.viewPath.indexOf(that.options.recordType) === -1) {
        fluid.fail("You must register a couch view for a new record type.  Can't continue.");
    }
    if (!that.options.path) {
        fluid.fail("You must configure the path within Express that this component will handle.");
    }
};

// Return a list of relevant parameters given a request object and our defaults.
gpii.ptd.records.extractParams = function(that, req) {
    if (!req.query) {
        throw records.constructError(400,"You must provide at least one query parameter.");
    }

    that.options.queryFields.forEach(function(field){
        if (that.options.defaults[field] || req.query[field]) {
            // TODO:  Convert to read new "forceLowercase" property
            if (req.query[field] && that.options.lowerCaseFields.indexOf(field) !== -1) {
                // TODO: Convert to read new "arrayAllowed" property
                if (req.query[field] instanceof Array) {
                    if (req.query[field].length > 0) {
                        that.params[field] = req.query[field].map(function(value){ return value.toLowerCase(); });
                    }
                    // TODO:  Convert to read new "default" property
                    else if (that.options.defaults[field]) {
                        that.params[field] = that.options.defaults[field];
                    }
                }
                else {
                    that.params[field] = req.query[field].toLowerCase();
                }
            }
            else {
                // TODO: Convert to read new "default" property
                that.params[field] = req.query[field] ? JSON.parse(req.query[field]) : that.options.defaults[field];
            }
        }
    });
};

// Validate the parameters extracted previously.
gpii.ptd.records.validateInput = function(that, req) {
    // TODO:  Move these simple checks to the extraction routine, and use the new "type" property
    if (that.params.updated) {
        var parsedDate =  new Date(that.params.updated);
        if (parsedDate.toString() === "Invalid Date") {
            throw records.constructError(400, "Invalid 'updated' date specified: '" + that.params.updated + "'...");
        }
    }

    if (that.params.offset) {
        var parsedOffset = parseInt(that.params.offset);
        if (isNaN(parsedOffset)) {
            throw records.constructError(400,"Offset must be a number.");
        }
    }

    if (that.params.limit) {
        var parsedLimit = parseInt(that.params.limit);
        if (isNaN(parsedLimit)) {
            throw records.constructError(400,"Limit must be a number.");
        }
    }

    // TODO:  Use the new "allowedValues" property to check this
    if (that.params.recordType) {
        var lowerCaseRecordType = config.recordType.toLowerCase();
        if (config.allowedRecordTypes.indexOf(lowerCaseRecordType) === -1) {
            throw records.constructError(400, "Invalid record type specified.");
        }
        else {
            that.params.recordTypes = [lowerCaseRecordType];
        }
    }
    else if (that.params.recordType) {
        var recordTypesToDisplay = [];
        if (that.params.recordType instanceof Array) {
            that.params.recordType.forEach(function(recordType){
                var lowerCaseRecordType = recordType.toLowerCase();
                if (config.allowedRecordTypes.indexOf(lowerCaseRecordType) === -1) {
                    throw records.constructError(400, "Invalid record type specified.");
                }
                else {
                    recordTypesToDisplay.push(lowerCaseRecordType);
                }
            });
        }
        else {
            var lowerCaseRequestRecordType = that.params.recordType.toLowerCase();
            if (config.allowedRecordTypes.indexOf(lowerCaseRequestRecordType) === -1) {
                throw records.constructError(400, "Invalid record type specified.");
            }
            else {
                recordTypesToDisplay.push(lowerCaseRequestRecordType);
            }
        }

        if (recordTypesToDisplay.length > 0) {
            that.params.recordTypes = recordTypesToDisplay;
        }
    }
};

// TODO: Rename this or pick apart into other methods.
gpii.ptd.records.getAndKnitTerms = function(error,response, body) {
    if (error) { return records.res.status(500).send( JSON.stringify(error)); }
    if (!body.rows) { return records.res.status(500).send("No usable result object was returned from couch."); }

    var recordsByTermId = {};
    var excludedParentIds = [];

    body.rows.forEach(function(row) {
        var record = row.value;
        var isParent = row.key[1] === 0;
        var termId = row.key[0];

        if (isParent) {
            // Exclude records that are too old, the wrong status, or the wrong record type
            if ((records.params.updated && new Date(record.updated) < records.params.updated) ||
                (records.params.statuses && records.params.statuses.indexOf(record.status.toLowerCase()) === -1) ||
                (records.params.recordTypes && records.params.recordTypes.indexOf(record.type.toLowerCase()) === -1)) {
                excludedParentIds.push(termId);
            }
            else {
                recordsByTermId[termId] = record;
            }
        }
        else {
            var parentRecord = recordsByTermId[termId];
            if (excludedParentIds.indexOf(termId) !== -1 && parentRecord) {
                var arrayName = "aliases";

                if (record.type.toLowerCase() === "translation") {
                    arrayName = "translations";
                }

                if (!parentRecord[arrayName]) { parentRecord[arrayName] = []; }
                parentRecord[arrayName].push(record);
            }
        }
    });

    var combinedRecords = Object.keys(recordsByTermId).map(function(key) { return recordsByTermId[key]; });
    records.results.total_rows = combinedRecords.length;

    records.results.records = paging.pageArray(combinedRecords, records.results);

    schemaHelper.setHeaders(records.res, "records");
    return records.res.status(200).send( JSON.stringify(records.results));
};

gpii.ptd.records.filterAndSort = function(that, array) {
    var filteredRecords = array.map(function(record){
        if ((!records.params.updated || new Date(record.updated) >= records.params.updated) &&
            (!records.params.statuses    || records.params.statuses.indexOf(record.status.toLowerCase()) !== -1) &&
            (!records.params.recordTypes || records.params.recordTypes.indexOf(record.type.toLowerCase()) !== -1)) {
            filteredRecords.push(record);
        }
    });

    if (records.params.sort) {
        sorting.sort(filteredRecords, records.params.sort);
    }

    records.results.records = paging.pageArray(filteredRecords, records.results);
    records.results.total_rows = filteredRecords.length;
};

//  The default router that works for everything but "terms".  Hit the right view and send back the results.
gpii.ptd.records.getRouter = function(that) {
    return function(req, res){
        try {
            // Extract the parameters we will use throughout the process from the request.
            gpii.ptd.record.extractParams(that, req);

            // Make sure the user has sent us valid input
            gpii.ptd.record.validateInput(that);
        }
        catch(err) {
            return res.status(err.status ? err.status : 500).send({ ok: false, message: JSON.stringify(err, null, 2) });
        }

        // Save the response session variable so that we can contact the user once we receive our results.
        that.res = res;

        var url = url.resolve(that.options.couchUrl, that.options.viewPath[that.options.recordType]);
        var requestConfig = {
            url:     url,
            data:    records.params,
            json:    true,
            timeout: 10000 // In practice, we probably only need a second, but the defaults are definitely too low.
        };

        request(requestConfig, that.sendResponse);
    };
};

// Send back the results we've received
gpii.ptd.record.sendResponse = function(that, error, response, body) {

    if (error) {
        var errorBody = {
            "ok": false
        };

        // Use the schema helper to set the right headers
        schemaHelper.setHeaders(res, "message");

        // Send the user the response
    }
    else {
        var responseBody = {
            "ok":          error ? false : true,
            "total_rows" : 0,
            "records":     [],
            "offset":      that.params.offset ? parseInt(that.params.offset) : that.options.defaults.offset,
            "limit":       that.params.limit  ? parseInt(that.params.limit)  : that.options.defaults.limit,
            "params":      that.params,
            "retrievedAt": new Date()
        };

        // Use the schema helper to set the right headers
        schemaHelper.setHeaders(res, "message");

        // Send the user the response
    }
};

var schemaBasePath = path.resolve(__dirname, "../../schema/schemas");

fluid.defaults("gpii.ptd.records", {
    gradeNames: ["gpii.express.router", "autoInit"],
    components: {
        type: "gpii.schema.helper"
    },
    members: {
        res: null
    },
    couchUrl: "",
    path:     null,
    schema:   "records",
    queryFields: {
        "sort": {
            type: "string"
        },
        "offset": {
            type: "number",
            default: 0
        },
        "limit": {
            type: "number",
            default: 25
        },
        "status": {
            type:       "string",
            arrayAllowed: true,
            forceLower: true,
            validValues: ["unreviewed", "draft", "candidate", "active", "deleted"],
            default: ["unreviewed", "draft", "candidate", "active"]
        },
        "children": {
            type: "boolean"
        },
        "updated": {
            type: "date"
        },
        "recordType": {
            type: "string",
            validValues: ["term", "alias", "condition", "transform", "operator"],
            arrayAllowed: true,
            forceLower: true
        }
    },
    viewPath: {
         alias:       "/_design/api/_view/aliases",
         transform:   "/_design/api/_view/transforms",
         translation: "/_design/api/_view/translations",
         condition:   "/_design/api/_view/conditions",
         term:        "/_design/api/_view/flat"
    },
    listeners: {
        "onCreate.checkRequirements": {
            funcName: "gpii.ptd.records.checkRequirements",
            args:     ["{that}"]
        },
        getRouter: {
            funcName: "gpii.ptd.records.getRouter",
            args:     ["{that}"]
        }
    },
    invokers: {
        sendResponse: {
            funcName: "gpii.ptd.records.sendResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        filterAndSort: {
            funcName: "gpii.ptd.records.filterAndSort",
            args:     ["{that}", "{arguments}.0"]
        }
    }
 });

// TODO: For terms, wire in a listener that waits for child data before responding

// A transitional "shim" to allow the previous CommonJS style of requiring this module.
// We silently ignore the "config" object, as this and child components have sensible defaults.
// TODO:  Remove this once the next level up ("api") has been refactored to use only Fluid components.
module.exports = function(config) {
    return gpii.ptd.records();
};


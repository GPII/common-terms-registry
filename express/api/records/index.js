"use strict";

module.exports = function(config) {
    var fluid = require('infusion');
    var schemaHelper = require("../../schema/lib/schema-helper")(config);
    var paging = require("../lib/paging")(config);

    var namespace = "gpii.ctr.records";

    // TODO:  Move to a global vocabulary
    if (config.recordType) {
        if (config.recordType.toLowerCase() === "term") {
            namespace = "gpii.ctr.terms";
        }
        else if (config.recordType.toLowerCase() === "alias") {
            namespace = "gpii.ctr.aliases";
        }
        else if (config.recordType.toLowerCase() === "transform") {
            namespace = "gpii.ctr.transforms";
        }
        else if (config.recordType.toLowerCase() === "translation") {
            namespace = "gpii.ctr.translations";
        }
        else if (config.recordType.toLowerCase() === "condition") {
            namespace = "gpii.ctr.conditions";
        }
        else {
            console.error("The record lookup API was configured to return an invalid record type '" + config.recordType + "'.  Ignoring this option, all records will be returned.");
        }
    }

    var records = fluid.registerNamespace(namespace);
    records.schema="records";

    // TODO:  Move this to a global configuration
    var allowedRecordTypes = ["term","alias","transform","translation","condition"];

    var children = require('../lib/children')(config, records);
    var request = require('request');

    records.parseAndValidateInput = function() {
        if (!records.req.query) {
            throw records.constructError(400,"You must provide the required query parameters to use this interface.");
        }

        if (records.req.query.updated) {
            var parsedDate =  new Date(records.req.query.updated);
            if (parsedDate.toString() === "Invalid Date") {
                throw records.constructError(400, "Invalid 'updated' date specified: '" + records.req.query.updated + "'...");
            }
            else {
                records.params.updated = parsedDate;
            }
        }

        // TODO: Move to a global configuration option for this
       var allowedStatuses = ["active","unreviewed","candidate","deleted", "draft"];
        if (records.req.query.status) {
            var statusesToDisplay = [];
            if (records.req.query.status instanceof Array) {
                records.req.query.status.forEach(function(status){
                    var lowerCaseStatus = status.toLowerCase();
                    if (allowedStatuses.indexOf(lowerCaseStatus) === -1){
                        throw records.constructError(400,"Invalid status '" + lowerCaseStatus + "' specified...");
                    }
                    else {
                        statusesToDisplay.push(lowerCaseStatus);
                    }
                });
            }
            else {
                var lowerCaseStatus = records.req.query.status.toLowerCase();
                if (allowedStatuses.indexOf(lowerCaseStatus) === -1){
                     throw records.constructError(400,"Invalid status '" + lowerCaseStatus + "' specified...");
                }
                else {
                    statusesToDisplay.push(lowerCaseStatus);
                }
            }

            if (statusesToDisplay.length > 0) {
                records.params.statuses = statusesToDisplay;
            }
        }

        if (records.req.query.offset) {
            var parsedOffset = parseInt(records.req.query.offset);
            if (isNaN(parsedOffset)) {
                throw records.constructError(400,"Offset must be a number.");
            }
            else {
                records.params.offset = parsedOffset;
            }
        }

        if (records.req.query.limit) {
            var parsedLimit = parseInt(records.req.query.limit);
            if (isNaN(parsedLimit)) {
                throw records.constructError(400,"Limit must be a number.");
            }
            else {
                records.params.limit = parsedLimit;
            }
        }

        if (records.req.query.children) {
            records.params.children = JSON.parse(records.req.query.children);
        }

        if (config.recordType) {
            if (records.req.query.recordType) {
                throw records.constructError(400,"The 'recordType' parameter cannot be used with this interface.");
            }
            if (config.recordType !== "term" && records.req.query.children) {
                throw records.constructError(400,"The 'children' parameter can only be used with terms.");
            }

            var lowerCaseRecordType = config.recordType.toLowerCase();
            if (allowedRecordTypes.indexOf(lowerCaseRecordType) === -1) {
                throw records.constructError(400, "Invalid record type specified.");
            }
            else {
                records.params.recordTypes = [lowerCaseRecordType];
            }
        }
        else if (records.req.query.recordType) {
            var recordTypesToDisplay = [];
            if (records.req.query.recordType instanceof Array) {
                records.req.query.recordType.forEach(function(recordType){
                    var lowerCaseRecordType = recordType.toLowerCase();
                    if (allowedRecordTypes.indexOf(lowerCaseRecordType) === -1) {
                        throw records.constructError(400, "Invalid record type specified.");
                    }
                    else {
                        recordTypesToDisplay.push(lowerCaseRecordType);
                    }
                });
            }
            else {
                var lowerCaseRecordType = records.req.query.recordType.toLowerCase();
                if (allowedRecordTypes.indexOf(lowerCaseRecordType) === -1) {
                    throw records.constructError(400, "Invalid record type specified.");
                }
                else {
                    recordTypesToDisplay.push(lowerCaseRecordType);
                }
            }

            if (recordTypesToDisplay.length > 0) {
                records.params.recordTypes = recordTypesToDisplay;
            }
        }
    };

    records.getAndKnitTerms = function(error,response, body) {
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

    records.getRecords = function(error,response,body) {
        if (error) { return records.res.status(500).send( JSON.stringify(error)); }
        if (!body.rows) { return records.res.status(500).send("No usable result object was returned from couch."); }

        var filteredRecords = [];
        body.rows.forEach(function(row) {
            var record = row.value;
            if ((!records.params.updated || new Date(record.updated) >= records.params.updated) &&
                (!records.params.statuses    || records.params.statuses.indexOf(record.status.toLowerCase()) !== -1) &&
                (!records.params.recordTypes || records.params.recordTypes.indexOf(record.type.toLowerCase()) !== -1)) {
                filteredRecords.push(record);
            }
        });

        records.results.records = paging.pageArray(filteredRecords, records.results);

        records.results.total_rows = filteredRecords.length;

        schemaHelper.setHeaders(records.res, "records");
        return records.res.status(200).send( JSON.stringify(records.results));
    };

    records.constructError = function(status, message) {
        var error = new Error(message);
        error.status = status;
        error.ok = false;
        return error;
    };

    var express = require('express');
    return express.Router().get('/', function(req, res){
        // per-request variables need to be defined here, otherwise (for example) the results of the previous search will be returned if the next search has no records
        records.params = {};
        records.req = req;
        records.res = res;
        schemaHelper.setHeaders(res, "message");

        records.results = {
            "ok": true,
            "total_rows" : 0,
            "records": [],
            "offset": records.req.query.offset ? parseInt(records.req.query.offset) : 0,
            "limit": records.req.query.limit ? parseInt(records.req.query.limit) : 100,
            "params": records.params,
            "retrievedAt": new Date()
        };


        // Server config validation
        if (!config || !config['couch.url']) {
            var message = "Your instance is not configured correctly to enable record lookup.  You must have a couch.url variable configured.";
            console.log(message);
            return res.status(500).send(JSON.stringify({ ok:false, message: message }));
        }

        // TODO:  Add support for versions

        // User input validation
        try {
            records.parseAndValidateInput();
        }
        catch(err) {
            return res.status(err.status ? err.status : 500).send(JSON.stringify(err));
        }

        var urlsByRecordType = {
            "entries":     config['couch.url'] + "/_design/api/_view/entries",
            "alias":       config['couch.url'] + "/_design/api/_view/aliases",
            "transform":   config['couch.url'] + "/_design/api/_view/transforms",
            "translation": config['couch.url'] + "/_design/api/_view/translations",
            "condition":   config['couch.url'] + "/_design/api/_view/conditions",
            "term":        config['couch.url'] + "/_design/api/_view/flat"
        };

        var recordType = config.recordType ? config.recordType : "entries";

        var requestConfig = {
            url: urlsByRecordType[recordType],
            data: records.params,
            json: true
        };

        if ((recordType === "term" || recordType === "entries") && records.params.children) {
            // For terms, we need to put all the records together
            request.get(requestConfig,records.getParentRecords);
        }
        else {
            // For everything else, we can just call the view for the recordType
            request.get(requestConfig,records.getRecords);
        }
    });
};

"use strict";

module.exports = function(config) {
    var fluid = require('infusion');

    var namespace = "gpii.ctr.records";
    if (config.recordType) {
        if (config.recordType.toLowerCase() === "general") {
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
        else if (config.recordType.toLowerCase() === "operator") {
            namespace = "gpii.ctr.operators";
        }
        else {
            console.error("The record lookup API was configured to return an invalid record type '" + config.recordType + "'.  Ignoring this option, all records will be returned.");
        }
    }

    var records = fluid.registerNamespace(namespace);
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
                records.filters.updated = parsedDate;
            }
        }

        var allowedStatuses = ["active","unreviewed","candidate","deleted"];
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
                records.filters.statuses = statusesToDisplay;
            }
        }

        if (records.req.query.offset) {
            var parsedOffset = parseInt(records.req.query.offset);
            if (isNaN(parsedOffset)) {
                throw records.constructError(400,"Offset must be a number.");
            }
            else {
                records.filters.offset = parsedOffset;
            }
        }

        if (records.req.query.limit) {
            var parsedLimit = parseInt(records.req.query.limit);
            if (isNaN(parsedLimit)) {
                throw records.constructError(400,"Limit must be a number.");
            }
            else {
                records.filters.limit = parsedLimit;
            }
        }

        if (config.recordType) {
            if (records.req.query.recordType) {
                throw records.constructError(400,"The 'recordType' parameter cannot be used with this interface.");
            }
        }
        else if (records.req.query.recordType) {
            var allowedRecordTypes = ["general","alias","transform","translation","operator"];
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
                records.filters.recordTypes = recordTypesToDisplay;
            }
        }
    };

    records.getAndKnitTerms = function(error,response, body) {
        if (error) { return records.res.send(500, JSON.stringify(error)); }
        if (!body.rows) { return records.res.send(500,"No usable result object was returned from couch."); }

        var recordsByTermId = {};
        var excludedParentIds = [];

        body.rows.forEach(function(row) {
            var record = row.value;
            var isParent = row.key[1] === 0;
            var termId = row.key[0];

            if (isParent) {
                // Exclude records that are too old, the wrong status, or the wrong record type
                if ((records.filters.updated && new Date(record.updated) < records.filters.updated) ||
                    (records.filters.statuses && records.filters.statuses.indexOf(record.status.toLowerCase()) === -1) ||
                    (records.filters.recordTypes && records.filters.recordTypes.indexOf(record.type.toLowerCase()) === -1)) {
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
        records.results.records = combinedRecords.slice(records.results.offset, records.results.offset + records.results.limit);

        return records.res.send(200, JSON.stringify(records.results));
    };

    records.getRecords = function(error,response,body) {
        if (error) { return records.res.send(500, JSON.stringify(error)); }
        if (!body.rows) { return records.res.send(500,"No usable result object was returned from couch."); }

        var filteredRecords = [];
        body.rows.forEach(function(row) {
            var record = row.value;
            if ((!records.filters.updated || new Date(record.updated) >= records.filters.updated) &&
                (!records.filters.statuses    || records.filters.statuses.indexOf(record.status.toLowerCase()) !== -1) &&
                (!records.filters.recordTypes || records.filters.recordTypes.indexOf(record.type.toLowerCase()) !== -1)) {
                filteredRecords.push(record);
            }
        });

        records.results.records = filteredRecords.slice(records.results.offset, records.results.offset + records.results.limit);
        records.results.total_rows = filteredRecords.length;

        return records.res.send(200, JSON.stringify(records.results));
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
        records.filters = {};
        records.req = req;
        records.res = res;
        res.set('Content-Type', 'application/json');

        records.results = {
            "ok": true,
            "total_rows" : 0,
            "records": [],
            "offset": records.req.query.offset ? parseInt(records.req.query.offset) : 0,
            "limit": records.req.query.limit ? parseInt(records.req.query.limit) : 100,
            "filters": records.filters,
            "retrievedAt": new Date()
        };

        // Server config validation
        if (!config || !config['couch.url']) {
            var message = "Your instance is not configured correctly to enable record lookup.  You must have a couch.url variable configured.";
            console.log(message);
            return res.send(500,JSON.stringify({ ok:false, message: message }));
        }

        // User input validation
        try {
            records.parseAndValidateInput();
        }
        catch(err) {
            return res.send(err.status ? err.status : 500, JSON.stringify(err));
        }

        var urlsByRecordType = {
            "entries":     config['couch.url'] + "/_design/app/_view/entries",
            "alias":       config['couch.url'] + "/_design/app/_view/aliases",
            "transform":   config['couch.url'] + "/_design/app/_view/transforms",
            "translation": config['couch.url'] + "/_design/app/_view/translations",
            "operator":    config['couch.url'] + "/_design/app/_view/operators",
            "general":     config['couch.url'] + "/_design/app/_view/flat"
        };

        var recordType = config.recordType ? config.recordType : "entries";

        var requestConfig = {
            url: urlsByRecordType[recordType],
            json: true
        };

        if (recordType === "general") {
            // For terms, we need to do one mass lookup and put all the records together
            request.get(requestConfig,records.getAndKnitTerms);
        }
        else {
            // For everything else, we can just call the view for the recordType
            request.get(requestConfig,records.getRecords);
        }
    });
};

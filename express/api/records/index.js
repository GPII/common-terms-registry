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

    records.validateInput = function() {
        if (!records.req.query) {
            throw records.constructError(400,"You must provide the required query parameters to use this interface.");
        }

        if (records.req.query.lastUpdated && new Date(records.req.query.lastUpdated).toString === "Invalid Date") {
            throw records.constructError(400, "Invalid 'lastUpdated' date specified: '" + records.req.query.lastUpdated + "'...");
        }

        var allowedStatuses = ["active","unreviewed","candidate","deleted"];
        if (records.req.query.status) {
            if (records.req.query.status instanceof Array) {
                records.req.query.status.forEach(function(status){
                    if (allowedStatuses.indexOf(status.toLowerCase()) === -1){
                        throw records.constructError(400,"Invalid status '" + status + "' specified...");
                    }

                });
            }
            else if (allowedStatuses.indexOf(records.req.query.status.toLowerCase()) === -1){
                 throw records.constructError(400,"Invalid status '" + records.req.query.status + "' specified...");
            }
        }

        if (records.req.query.offset && isNaN(parseInt(records.req.query.offset))) {
            throw records.constructError(400,"Offset must be a number.");
        }

        if (records.req.query.limit && isNaN(parseInt(records.req.query.limit))) {
            throw records.constructError(400,"Limit must be a number.");
        }

        if (config.recordType) {
            if (records.req.query.recordType) {
                throw records.constructError(400,"The 'recordType' parameter cannot be used with this interface.");
            }
        }
        else if (records.req.query.recordType) {
            var allowedRecordTypes = ["general","alias","transform","translation","operator"];
            if (allowedRecordTypes.indexOf(records.req.query.recordType.toLowerCase()) === -1) {
                throw records.constructError(400, "Invalid record type specified.");
            }
        }
    };

    records.getAndKnitTerms = function(error,response, body) {
        if (error) { return records.res.send(500, JSON.stringify(error)); }
        if (!body.rows) { return records.res.send(500,"No usable result object was returned from couch."); }

        // TODO:  Add support for limiting by status while still preserving paging
        // TODO:  Add support for limiting by lastUpdated date while still preserving paging

        var recordsByTermId = {};
        body.rows.forEach(function(row) {
            var record = row.value;
            var isParent = row.key[1] === 0;
            var termId = row.key[0];

            if (isParent) {
                recordsByTermId[termId] = record;
            }
            else {
                var parentRecord = recordsByTermId[termId];
                var arrayName = "aliases";

                if (record.type.toLowerCase() === "translation") {
                    arrayName = "translations";
                }

                if (!parentRecord) {
                    console.error("No parent record was found for record with uniqueId '" + record.uniqueId + "'...");
                }
                else {
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

        records.results.total_rows = body.rows.length;

        // TODO:  Add support for limiting by status while still preserving paging
        // TODO:  Add support for limiting by lastUpdated date while still preserving paging
        // TODO:  Add support for limiting by record type while still preserving paging
        body.rows.forEach(function(record) {
            records.results.records.push(record.value);
        });

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
        records.req = req;
        records.res = res;
        res.set('Content-Type', 'application/json');

        records.results = {
            "ok": true,
            "total_rows" : 0,
            "records": [],
            "q": records.req.query.q,
            "offset": records.req.query.offset ? parseInt(records.req.query.offset) : 0,
            "limit": records.req.query.limit ? parseInt(records.req.query.limit) : 100,
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
            records.validateInput();
        }
        catch(err) {
            return res.send(err.status ? err.status : 500, JSON.stringify(err));
        }

        // If we pass the right query parameters, we can let couch do the paging for us instead of doing it in memory
        // FIXME:  Only if we want to completely screw up limiting by status or recordType
        var queryParams = "";
        if (req.query.offset) {
            queryParams += "?skip=" + req.query.offset;
        }
        if (req.query.limit) {
            queryParams += (queryParams.length > 0 ? "&" : "?") + "limit=" + req.query.limit;
        }

        var urlsByRecordType = {
            "entries":     config['couch.url'] + "/_design/app/_view/entries" + queryParams,
            "alias":       config['couch.url'] + "/_design/app/_view/aliases" + queryParams,
            "transform":   config['couch.url'] + "/_design/app/_view/transforms" + queryParams,
            "translation": config['couch.url'] + "/_design/app/_view/translations" + queryParams,
            "operator":    config['couch.url'] + "/_design/app/_view/operators" + queryParams,
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

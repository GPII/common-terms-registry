exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

// TODO:  Generate and serve up meaningful API documentation
exports.apidocs = function(req, res){
    res.render('apidocs', { title: 'Common Terms Registry API Documentation' });
};

exports.api = function(req, res){
    res.set('Content-Type', 'application/json');

    // Retrieve the master list of records from couch (http://localhost:5984/tr/_design/app/_view/flat)
    var request = require('request');
    // TODO:  Make the URL configurable such that it works in production as well as in a dev environment
    var options = {
        "url" : "http://localhost:5984/tr/_design/app/_view/flat",
        "json": true
    };

    var allRecords = [];
    var allRecordHash = {};
    request.get(options, function (error, response, body) {
        if (error) {
            res.send(JSON.stringify(error));
            return;
        }

        // Combine all records into a list of common terms that contain each of their child records
        var currentTermRecord = {};
        for (var i = 0; i < body.rows.length; i++) {
            var record = body.rows[i].value;
            if (record.type == "GENERAL") {
                currentTermRecord = record;
                allRecords.push(record);
                allRecordHash[record.uniqueId] = record;
            }
            else {
                var field = "aliases";
                if (record.type === "TRANSFORMATION") {
                    field = "transformations";
                }
                if (record.type === "TRANSLATION") {
                    field = "translations";
                }
                if (!currentTermRecord[field]) {
                    currentTermRecord[field] = [];
                }
                currentTermRecord[field].push(record);
            }
        }

        // If we have search data:
        //  1) Perform a search against lucene (http://localhost:5984/_fti/local/tr/_design/lucene/by_content?q=reading&order=uniqueId)
        //  2) Return an evolved version of the search results containing all matching common terms and their children
        if (req.query.q) {
            var queryString = "";
            // We pass along the following parameters to Lucene:  q, sort
            // Both can be single values or arrays
            var fields = ["q","sort"];
            for (var i in fields) {
                var field = fields[i];
                if (req.query[field]) {
                    if (queryString.length > 0) { queryString += '&'; }

                    if (req.query[field] instanceof Array) {
                        queryString += field + "=" + req.query[field].join('&'+field+'=');
                    }
                    else {
                        queryString += field + "=" + req.query[field];
                    }
                }
            }

            console.log("query string: '" + JSON.stringify(queryString) + "'");

            var searchOptions = {
                // TODO: Implement support for lucene sorting (must support multiple fields)
                // TODO:  Test with multiple parameters
                // TODO:  Abstract out for base URL to be root configurable for both production and developer instances
                "url" : "http://localhost:5984/_fti/local/tr/_design/lucene/by_content?" + queryString,
                "json": true
            };

            request.get(searchOptions, function (searchError, searchResponse, searchBody) {
                if (searchError) {
                    res.send(JSON.stringify(searchError));
                    return;
                }

                // Each common term appears at the position where the highest matched component appeared in the results.  This should preserve sort ordering.
                var uniqueIds = [];
                var records = [];
                console.log("Found " + searchBody.rows.length + " records...");
                for (var i = 0; i < searchBody.rows.length ; i++) {
                    var luceneRecord = searchBody.rows[i];
                    var record = luceneRecord.fields;
                    var termId = record.uniqueId;
                    if (record.type === "ALIAS" || record.type === "TRANSFORMATION") { termId = record.aliasOf; }
                    if (record.type === "TRANSLATION") { termId = record.translationOf; }

                    if (uniqueIds.indexOf(termId) < 0) {
                        uniqueIds.push(termId);
                        records.push(allRecordHash[termId]);
                    }
                }

                // TODO:  Add support for paging (must be done after full search results are returned, as Lucene can't sanely page the flattened and distinct result set).

                // TODO: Send metadata (count, query parameters, etc.) as well
                res.send(JSON.stringify(records));
            })
        }
        else {
            // If we have no search data, return the complete data set
            // TODO: Send metadata (count, query parameters, etc.) as well

            res.send(JSON.stringify(allRecords));
        }
    });
};


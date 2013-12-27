function(head, req) {
    provides('json',function() {
        var jTableData = {};
        // TODO:  Check the request and only return OK if the result is, well, OK...
        jTableData.Result  = 'OK';

        // jtSorting=uniqueId%20ASC
        var sortField = "uniqueId";
        var sortDirection = "ASC";
        if (req.query.jtSorting !== undefined) {
            var sortOptions = req.query.jtSorting.split(" ");
            if (sortOptions !== undefined && sortOptions[0] !== undefined) {
                sortField = sortOptions[0];
            }
            if (sortOptions !== undefined && sortOptions[1] !== undefined) {
                sortDirection = sortOptions[1];
            }
        }

        var jtStartIndex = 0;
        if (req.query.jtStartIndex != undefined) {
            jtStartIndex = parseInt(req.query.jtStartIndex);
        }
        
        var jtPageSize = 10;
        if (req.query.jtPageSize != undefined) {
            jtPageSize = parseInt(req.query.jtPageSize);
        }

        var displayStatus = "active";
        if (req.query.displayStatus !== undefined) {
            displayStatus = req.query.displayStatus;
        }

        var displayType = "GENERAL";
        if (req.query.displayType !== undefined) {
            displayType = req.query.displayType;
        }

        var onlyUnreviewed = false;
        if (req.query.onlyUnreviewed !== undefined) {
            onlyUnreviewed =  req.query.onlyUnreviewed === "true";
        }

        var queryString = undefined;
        if (req.query.q !== undefined) {
            queryString =  req.query.q;
        }

        var allRecords = [];
        while (row = getRow()) {
            // This should only be necessary until all records have a status
            var status = "active";
            if (row.value.status !== undefined) { status = row.value.status; }

            // This should only be necessary until all records have a record type
            var type = "GENERAL";
            if (row.value.type !== undefined) { type = row.value.type; }

            var matches = false;
            if (queryString == undefined) {
                matches = true;
            }
            else {
                // TODO:  This is horrible.  We should be using couchdb-lucene or something performant
                if (typeof row.value.uniqueId == "string" && row.value.uniqueId.toLowerCase().indexOf(queryString.toLowerCase()) >= 0) {
                    matches = true;
                }
                if (typeof row.value.definition == "string" && row.value.definition.toLowerCase().indexOf(queryString.toLowerCase()) >= 0) {
                    matches = true;
                }
                if (typeof row.value.notes == "string" && row.value.notes.toLowerCase().indexOf(queryString.toLowerCase()) >= 0) {
                    matches = true;
                }

                if (row.value.aliases && row.value.aliases.length > 0) {
                    for (var position in row.value.aliases) {
                        var alias = row.value.aliases[position];

                        if (typeof alias.value.uniqueId == "string" && alias.value.uniqueId.toLowerCase().indexOf(queryString.toLowerCase()) >= 0) {
                            matches = true;
                        }
                        if (typeof alias.value.definition == "string" && alias.value.definition.toLowerCase().indexOf(queryString.toLowerCase()) >= 0) {
                            matches = true;
                        }
                        if (typeof alias.value.notes == "string" && alias.value.notes.toLowerCase().indexOf(queryString.toLowerCase()) >= 0) {
                            matches = true;
                        }
                    }
                }
            }

            if (status === displayStatus && type === displayType && (!onlyUnreviewed || (row.value.unreviewedComments !== undefined && row.value.unreviewedComments.length > 0))) {
                if (matches) {
                    allRecords.push({
                        "type":                 row.value.type,
                        "status":               row.value.status,
                        "uniqueId":             row.value.uniqueId,
                        "localId":              row.value.localId,
                        "valueSpace":           row.value.valueSpace,
                        "defaultValue":         row.value.defaultValue,
                        "aliasOf":              row.value.aliasOf,
                        "translationOf":        row.value.translationOf,
                        "termLabel":            row.value.termLabel,
                        "definition":           row.value.definition,
                        "notes":                row.value.notes,
                        "uses":                 row.value.uses,
                        "unreviewedComments":   row.value.unreviewedComments,

                        // non-canonical fields
                        "_id" :                 row.value._id,
                        "_rev" :                row.value._rev,
                        "aliases":              row.value.aliases,
                        "source":               row.value.source
                    });
                }
            }
        }

        // Sort the list of results if the jtSorting option is anything but "uniqueID ASC" (the default).
        if (sortField !== "uniqueId" || sortField !== "ASC") {
            allRecords.sort(function(a,b) {
                    aStringValue = "";
                    bStringValue = "";

                    if (sortField === "aliases") {
                        if (a[sortField] !== undefined && a[sortField][0] !== undefined) { aStringValue = a[sortField][0]['key'].toString().toLowerCase(); }
                        if (b[sortField] !== undefined && b[sortField][0] !== undefined) { bStringValue = b[sortField][0]['key'].toString().toLowerCase(); }
                    }
                    else {
                        if (a[sortField] !== undefined) { aStringValue = a[sortField].toString().toLowerCase(); }
                        if (b[sortField] !== undefined) { bStringValue = b[sortField].toString().toLowerCase(); }
                    }

                    var sortMultiplier = (sortDirection === "ASC" ? 1 : -1);
                    return aStringValue.localeCompare(bStringValue) * sortMultiplier;
            });
        }

        jTableData.Records = allRecords.slice(jtStartIndex,jtStartIndex+jtPageSize);
        jTableData.TotalRecordCount = allRecords.length;

        // make sure to stringify the results :)
        send(JSON.stringify(jTableData));        
    });
}
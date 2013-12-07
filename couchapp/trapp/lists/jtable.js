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

        var allRecords = [];
        while (row = getRow()) {
            allRecords.push({
                "type":         row.value.type,
                "uniqueId":     row.value.uniqueId,
                "localId":      row.value.localId,
                "valueSpace":   row.value.valueSpace,
                "defaultValue": row.value.defaultValue,
                "aliasOf":      row.value.aliasOf,
                "termLabel":    row.value.termLabel,
                "definition":   row.value.definition,
                "notes":        row.value.notes,
                "uses":         row.value.uses,
                // non-canonical fields are prefixed with an underscore
                "_id" :         row.value._id,
                "_rev" :        row.value._rev,
                "aliases":     row.value.aliases,
                "source":      row.value.source
            });
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


//        for (var record = 0; record < (jtStartIndex + jtPageSize); record++) {
//            row = getRow();
//            if (record < jtStartIndex) continue;
//            if (record >= head.total_rows) break;
//
//            jTableData.Records.push({
//                "type":         row.value.type,
//                "uniqueId":     row.value.uniqueId,
//                "localId":      row.value.localId,
//                "valueSpace":   row.value.valueSpace,
//                "defaultValue": row.value.defaultValue,
//                "aliasOf":      row.value.aliasOf,
//                "termLabel":    row.value.termLabel,
//                "definition":   row.value.definition,
//                "notes":        row.value.notes,
//                "uses":         row.value.uses,
//                // non-canonical fields are prefixed with an underscore
//                "_id" :         row.value._id,
//                "_rev" :        row.value._rev,
//                "aliases":     row.value.aliases,
//                "source":      row.value.source
//            });
//        }

        jTableData.TotalRecordCount = head.total_rows; 

        // make sure to stringify the results :)
        send(JSON.stringify(jTableData));        
    });
}
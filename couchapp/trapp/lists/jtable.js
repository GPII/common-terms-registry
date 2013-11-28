function(head, req) {
    provides('json',function() {
        var jTableData = {};
        // TODO:  Check the request and only return OK if the result is, well, OK...
        jTableData.Result  = 'OK';
        
        var jtStartIndex = 0;
        if (req.query.jtStartIndex != undefined) {
            jtStartIndex = parseInt(req.query.jtStartIndex);
        }
        
        var jtPageSize = 10;
        if (req.query.jtPageSize != undefined) {
            jtPageSize = parseInt(req.query.jtPageSize);
        }

        jTableData.Records = [];

        for (var record = 0; record < (jtStartIndex + jtPageSize); record++) {
            row = getRow();
            if (record < jtStartIndex) continue;
            if (record >= head.total_rows) break;
            
            jTableData.Records.push({
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

        jTableData.TotalRecordCount = head.total_rows; 

        // make sure to stringify the results :)
        send(JSON.stringify(jTableData));        
    });
}
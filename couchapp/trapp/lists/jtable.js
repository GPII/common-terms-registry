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
                "key" :                 row.key,
                "id" :                  row.id,
                "recordType":           row.value.recordType,
                "uniqueId":	            row.value.uniqueId,
                "localUniqueId":        row.value.localUniqueId,
                "defaultValue":         row.value.defaultValue,
                "description":          row.value.description,
                "notes":                row.value.notes,
                "userPreference":       row.value.userPreference,
                "aliasTranslationOf":   row.value.aliasTranslationOf,
                "groups":               row.value.groups,
                "ids" :                 row.value.ids
            });
        }

        jTableData.TotalRecordCount = head.total_rows; 

        // make sure to stringify the results :)
        send(JSON.stringify(jTableData));        
    });
}
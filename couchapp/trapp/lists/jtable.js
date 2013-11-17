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
                "id" :                  row.id,
                "key" :                 row.key,
                "uniqueId":	            row.value.uniqueId,
                "localUniqueId":        row.value.localUniqueId,
                "termLabel":            row.value.termLabel,
                "type":                 row.value.type,
                "uses":	                row.value.uses,
                "defaultValue":         row.value.defaultValue,
                "definition":           row.value.definition,
                "notes":                row.value.notes,
                "valueSpace":           row.value.valueSpace,
                "aliasOf":              row.value.aliasOf,
                "aliases":              row.value.aliases
            });
        }

        jTableData.TotalRecordCount = head.total_rows; 

        // make sure to stringify the results :)
        send(JSON.stringify(jTableData));        
    });
}
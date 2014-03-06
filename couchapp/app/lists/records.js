function(head, req) {
    provides('json',function() {
        function parseArrayQueryVariable(key) {
            var array = [];
            if (req.query[key]) {
                // Try to parse the value as an array first and fail over to the raw value
                try {
                    array = JSON.parse(req.query[key]);
                }
                catch (e) {
                    array = req.query[key];
                }
            }
            return array;
        }

        function parseSortOption(sortString) {
            var sortOption = {};
            sortOption.multiplier = 1;

            if (sortString !== undefined) {
                var matches = sortString.match(/ (desc|asc)$/i);
                if (matches) {
                    sortOption.field = sortString.replace(/ (desc|asc)$/i,"");
                    if (matches[0] === " desc" || matches[0] === " DESC") sortOption.multiplier=-1;
                }
                else {
                    sortOption.field = sortString;
                }
            }

            return sortOption;
        }

        // TODO:  Agree on and implement filtering (limiting by record type, fields matching search string)

        var startpos = 0;
        if (req.query.startpos !== undefined) {
            startpos = parseInt(req.query.startpos);
        }

        var pagesize = 100;
        if (req.query.pagesize !== undefined) {
            pagesize = parseInt(req.query.pagesize);
        }

        var order = parseArrayQueryVariable("sort");

        var results = {};

        var allRecords = [];
        while (row = getRow()) {
            allRecords.push({
                "type":                 row.value.type,
                "status":               row.value.status,
                "uniqueId":             row.value.uniqueId,
                "localId":              row.value.localId,
                "valueSpace":           row.value.valueSpace,
                "algorithm":            row.value.algorithm,
                "defaultValue":         row.value.defaultValue,
                "aliasOf":              row.value.aliasOf,
                "translationOf":        row.value.translationOf,
                "termLabel":            row.value.termLabel,
                "definition":           row.value.definition,
                "notes":                row.value.notes,
                "uses":                 row.value.uses
            });
        }

        results.total_rows = allRecords.length;
        results.startpos   = startpos;
        results.pagesize   = pagesize;

        if (order !== undefined) {
            allRecords.sort(function(a,b) {
                var sortOptions = [];
                if (order instanceof Array) {
                    for (var i = 0 ; i < order.length; i++) {
                        sortOptions.push(parseSortOption(order[i]));
                    }
                }
                else {
                    sortOptions.push(parseSortOption(order))
                }
                results.order = sortOptions;

                for (var j = 0 ; j < sortOptions.length; j++) {
                    var sortOption = sortOptions[j];

                    var aStringValue = "", bStringValue = "";
                    if (a[sortOption.field] !== undefined) { aStringValue = a[sortOption.field].toString().toLowerCase(); }
                    if (b[sortOption.field] !== undefined) { bStringValue = b[sortOption.field].toString().toLowerCase(); }

                    var result = aStringValue.localeCompare(bStringValue) * sortOption.multiplier;
                    if (result !== 0) return result;
                }

                return 0;
            });
        }

        // If the limit is set to -1, return all records.  Otherwise, return only a set number of records
        results.rows = (pagesize <= 0) ? allRecords : allRecords.slice(startpos,startpos+pagesize);

        // make sure to stringify the results :)
        send(JSON.stringify(results));
    });
}
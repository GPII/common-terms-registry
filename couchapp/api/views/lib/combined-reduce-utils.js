// To test our reduce functions, we have to wrap them in this kind of construct.  Unfortunately, reduce functions do not support "require", which means we have to copy and paste our code into this file to update the tests....
exports.reducer = function(keys, values, rereduce) {
    "use strict";
    // Reduce all the records with the same "parent" ID to a single structure...
    function combine(existingRecord, newRecord) {
        var combinedRecord = existingRecord ? JSON.parse(JSON.stringify(existingRecord)) : {};
        debugger;
        var qualifier = 'partial';
        if (newRecord.type) {
            if (newRecord.type.toLowerCase() === 'term') {
                qualifier = 'term';
            }
            if (newRecord.type.toLowerCase() === 'alias') {
                qualifier = 'aliases';
            }
            else if (newRecord.type.toLowerCase() === 'translation') {
                qualifier = 'translations';
            }
        }

        if (qualifier === 'term') {
            combinedRecord = JSON.parse(JSON.stringify(newRecord));
            if (existingRecord && existingRecord.aliases)      { combinedRecord.aliases      = JSON.parse(JSON.stringify(existingRecord.aliases));      }
            if (existingRecord && existingRecord.translations) { combinedRecord.translations = JSON.parse(JSON.stringify(existingRecord.translations)); }
        }
        else if (qualifier === 'partial') {
            if (newRecord && newRecord.aliases)      { combinedRecord.aliases      = JSON.parse(JSON.stringify(newRecord.aliases));      }
            if (newRecord && newRecord.translations) { combinedRecord.translations = JSON.parse(JSON.stringify(newRecord.translations)); }
        }
        else {
            if (!combinedRecord[qualifier]) { combinedRecord[qualifier] = []; }
            combinedRecord[qualifier].push(JSON.parse(JSON.stringify(newRecord)));
        }

        return combinedRecord;
    }

    // Combine whatever previous results we have been handed
    if (rereduce) {
        var rereduced = {};
        values.forEach(function(partial){
            Object.keys(partial).forEach(function(key){
                var record = partial[key];
                rereduced[key] = combine(rereduced[key], record);
            });
        });

        // Flatten the results to an array
        return rereduced;

    }

    // We are conducting the first pass at this point...
    // We'll end up with records like any combination of:
    // {
    //   'uniqueId1': { key1: value1, key2: value2, aliases: [], translations: [] },
    //   'uniqueId2': { key1: value1, key2: value2 },
    //   'uniqueId3': { aliases: [ {key1: value1} ], translations: [{ key2: value2 }] }
    // }
    else {
        var reduced = {};
        for (var a = 0; a < values.length ; a++) {
            var record       = values[a];
            var groupId      = record.uniqueId;

            if (record.type.toLowerCase() === 'alias' ) {
                groupId = record.aliasOf;
            }
            else if (record.type.toLowerCase() === 'translation') {
                groupId = record.translationOf;
            }

            if (groupId) {
                reduced[groupId] = combine(reduced[groupId], record);
            }
        }
        return reduced;
    }
};

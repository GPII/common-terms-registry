// Function to standardized the data returned by all couch endpoints
exports.getRecordFields = function(doc) {
    var fields = {};

    // fields in common to all records
    var commonFields = ["uniqueId", "localId", "type","status", "notes", "nameSpace", "permanency", "updated"];
    commonFields.forEach(function(field){
        if (doc[field]) { fields[field] = doc[field]; }
    });

    // fields unique to record types
    var recordFields = [];
    if (doc.type.toLowerCase() === "general") {
        recordFields = ["valueSpace", "termLabel", "definition", "applicationUnique", "uses"];
    }
    else if (doc.type.toLowerCase() === "alias") {
        recordFields = ["aliasOf", "termLabel", "uses"];
    }
    else if (doc.type.toLowerCase() === "translation") {
        recordFields = ["translationOf", "valueSpace", "termLabel", "definition", "uses"];
    }
    else if (doc.type.toLowerCase() === "transformation") {
        recordFields = ["aliasOf", "valueSpace", "termLabel", "uses"];
    }
    else if (doc.type.toLowerCase() === "operator") {
        recordFields = ["definition"];
    }

    recordFields.forEach(function(field){
        if (doc[field]) { fields[field] = doc[field]; }
    });

    // We must include the _rev field for the "write" portions of our API
    fields._rev = doc._rev;

    return fields;
};

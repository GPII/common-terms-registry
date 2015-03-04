// Function to standardized the data returned by all couch endpoints
exports.getRecordFields = function(doc) {
    var fields = {};

    // fields in common to all records
    var commonFields = ["uniqueId", "localId", "type","status", "notes", "nameSpace", "permanency", "updated"];
    commonFields.forEach(function(field){
        if (doc[field]) { fields[field] = doc[field]; }
    });

    // fields unique to record types, including hard-wired aliases
    var recordFields = [];
    if (doc.type.toLowerCase() === "term") {
        recordFields = ["valueSpace", "termLabel", "defaultValue", "definition", "applicationUnique", "uses"];
    }
    else if (doc.type.toLowerCase() === "alias") {
        recordFields = ["aliasOf", "termLabel", "defaultValue", "uses", "ulUri"];
    }
    else if (doc.type.toLowerCase() === "translation") {
        recordFields = ["translationOf", "valueSpace", "defaultValue", "termLabel", "definition", "uses"];
    }
    else if (doc.type.toLowerCase() === "transform") {
        recordFields = ["aliasOf", "valueSpace", "termLabel", "defaultValue", "uses"];
    }
    else if (doc.type.toLowerCase() === "condition") {
        recordFields = ["definition"];
    }

    recordFields.forEach(function(field){
        if (doc[field]) { fields[field] = doc[field]; }
    });

    // We must include the _rev and _id fields for the "write" portions of our API
    fields._rev = doc._rev;
    fields._id = doc._id;

    return fields;
};

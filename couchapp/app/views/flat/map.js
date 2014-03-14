function(doc) {
    if (doc) {
        var key = doc.uniqueId;
        var type = 0;

        // Don't include operators in the combined view for now.
        if (doc.type === "OPERATOR") { return; }
        else if (doc.type === "ALIAS" || doc.type === "TRANSFORMATION") { key = doc.aliasOf; type = 1; }
        else if (doc.type === "TRANSLATION") { key = doc.translationOf; type = 1; }

        emit([key,type], {
            "type":                 doc.type,
            "uniqueId":	            doc.uniqueId,
            "localId":              doc.localId,
            "valueSpace":           doc.valueSpace,
            "defaultValue":         doc.defaultValue,
            "aliasOf":              doc.aliasOf,
            "termLabel":            doc.termLabel,
            "definition":	        doc.definition,
            "notes":	            doc.notes,
            "uses":	                doc.uses,
            "status":	            doc.status,
            // non-canonical fields
            "_id" :                 doc._id,
            "_rev" :                doc._rev,
            "source":               doc.source,
            "unreviewedComments":   doc.unreviewedComments,
            "reviewedComments":     doc.reviewedComments
        });
    }
}
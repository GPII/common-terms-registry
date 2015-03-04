function(doc) {
    if (doc) {
        var key = doc.uniqueId;
        var type = 0;

        // Don't include operators in the combined view for now.
        if (doc.type === "condition") { return; }
        else if (doc.type === "alias" || doc.type === "transform") { key = doc.aliasOf; type = 1; }
        else if (doc.type === "translation") { key = doc.translationOf; type = 1; }

        emit([key,type], require('views/lib/recordUtils').getRecordFields(doc));
    }
}
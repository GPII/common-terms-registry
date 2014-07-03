function(rawDoc) {
    if (rawDoc) {
        // Pouch and couch handle documents differently, which is why we need something like this.
        var doc = rawDoc.doc ? rawDoc.doc : rawDoc;
        if (doc && doc.type && (doc.type.toLowerCase() === 'operator') && doc.status !== "deleted") {
            emit(doc.uniqueId, require('views/lib/recordUtils').getRecordFields(doc));
        }
    }
}
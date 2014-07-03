function(rawDoc) {
    if (rawDoc) {
        // Pouch and couch handle documents differently, which is why we need something like this.
        var doc = rawDoc.doc ? rawDoc.doc : rawDoc;
        if (doc && doc.type && (doc.type.toLowerCase() === 'alias' || doc.type.toLowerCase === 'transformation' || doc.type.toLowerCase === 'translation') && doc.status !== "deleted") {
            var key = doc.aliasOf;
            if (doc.type.toLowerCase === 'translation') {
              key = doc.translationOf;
            }
            emit(key, require('views/lib/recordUtils').getRecordFields(doc));
      }
    }
}
function(doc) {
    if (doc && doc.type && (doc.type.toLowerCase() === 'alias' || doc.type.toLowerCase === 'transformation' || doc.type.toLowerCase === 'translation') && doc.status !== "deleted") {
        var key = doc.aliasOf;
        if (doc.type.toLowerCase === 'translation') {
          key = doc.translationOf;
        }
        emit(key, require('views/lib/recordUtils').getRecordFields(doc));
    }
}
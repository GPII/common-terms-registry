function(doc) {
    if (doc) {
        if (doc && doc.type && (doc.type.toLowerCase() === 'condition')) {
            emit(doc.uniqueId, require('views/lib/recordUtils').getRecordFields(doc));
        }
    }
}
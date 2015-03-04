function(doc) {
    if (doc && doc.type && (doc.type.toLowerCase() === 'alias')) {
        emit(doc.uniqueId, require('views/lib/recordUtils').getRecordFields(doc));
    }
}
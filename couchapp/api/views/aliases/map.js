function(doc) {
    if (doc && doc.type && (doc.type.toLowerCase() === 'alias') && doc.status !== "deleted") {
        emit(doc.uniqueId, require('views/lib/recordUtils').getRecordFields(doc));
    }
}
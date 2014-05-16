function(doc) {
    if (doc && (doc.type.toLowerCase() === 'operator') && doc.status !== "deleted") {
        emit(doc.uniqueId, require('views/lib/recordUtils').getRecordFields(doc));
    }
}
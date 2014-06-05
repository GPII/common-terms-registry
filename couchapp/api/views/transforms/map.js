function(doc) {
    if (doc && (doc.type.toLowerCase() === 'transformation') && doc.status !== "deleted") {
        emit(doc.uniqueId, require('views/lib/recordUtils').getRecordFields(doc));
    }
}
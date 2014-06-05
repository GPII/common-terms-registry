function(doc) {
    if (doc && doc.type && doc.type.toLowerCase() == 'general' && doc.status !== "deleted") {
        emit(doc.uniqueId, require('views/lib/recordUtils').getRecordFields(doc));
    }
};
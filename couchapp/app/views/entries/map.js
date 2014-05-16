function(doc) {
    if (doc) {
        emit(doc.uniqueId, require('views/lib/recordUtils').getRecordFields(doc));
    }
}
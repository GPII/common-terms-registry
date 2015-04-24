function(doc) {
    if (doc) {
        if (doc && doc.type && doc.type.toLowerCase() == 'term' && doc.status !== "deleted") {
            emit(doc.uniqueId, doc);
        }
    }
}
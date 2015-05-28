function(doc) {
    if (doc) {
        emit(doc.uniqueId, doc);
    }
}
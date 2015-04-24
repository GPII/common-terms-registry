function(doc) {
    if (doc) {
        if (doc && doc.type && (doc.type.toLowerCase() === 'transform')) {
            emit(doc.uniqueId, doc);
        }
    }
}
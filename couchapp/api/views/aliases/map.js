function(doc) {
    if (doc && doc.type && doc.type.toLowerCase() === "alias") {
        emit(doc.uniqueId, doc);
    }
}
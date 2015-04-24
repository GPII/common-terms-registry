function(doc) {
    if (doc && doc.type && (doc.type.toLowerCase() === "alias" || doc.type.toLowerCase === "transform" || doc.type.toLowerCase === "translation")) {
        var key = doc.aliasOf;
        if (doc.type.toLowerCase === "translation") {
            key = doc.translationOf;
        }
        emit(key, doc);
    }
}
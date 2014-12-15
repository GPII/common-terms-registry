function(doc) {
    "use strict";
    var key = doc.uniqueId;
    if (doc && doc.type && (doc.type.toLowerCase() === 'alias' || doc.type.toLowerCase === 'transform' || doc.type.toLowerCase === 'translation')) {
        key = doc.aliasOf;
        if (doc.type.toLowerCase === 'translation') {
          key = doc.translationOf;
        }
    }
    emit(key, require('views/lib/recordUtils').getRecordFields(doc));
}
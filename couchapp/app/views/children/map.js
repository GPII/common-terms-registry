function(doc) {
    if (doc && (doc.type.toLowerCase() === 'alias' || doc.type.toLowerCase === 'transformation' || doc.type.toLowerCase === 'translation') && doc.status !== "deleted") {
      var key = doc.aliasOf;
      if (doc.type.toLowerCase === 'translation') {
          key = doc.translationOf;
      }

      emit(key, {
 		"type":             doc.type,
		"uniqueId":         doc.uniqueId,
		"localId":          doc.localId,
        "aliasOf":          doc.aliasOf,
        "translationOf":    doc.translationOf,
		"notes":            doc.notes,
		"termLabel":        doc.termLabel,
		"uses":             doc.uses,
        "status":           doc.status,
        // non-canonical fields
        "source":           doc.source
      });
  }
};
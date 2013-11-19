function(doc) {
    if (doc && (doc.type.toLowerCase() == 'alias' || doc.type.toLowerCase == 'aliastransformation')) {
      emit(doc.uniqueId, {
	    "_id" :               doc._id,
	    "_rev" :              doc._rev,
        "aliasOf":            doc.aliasOf,
		"localUniqueId":      doc.localUniqueId,
		"notes":	          doc.notes,
		"termLabel":          doc.termLabel,
 		"type":               doc.type,
		"uniqueId":           doc.uniqueId
      });
  }
};
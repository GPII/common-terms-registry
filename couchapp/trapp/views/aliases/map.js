function(doc) {
    if (doc && (doc.type.toLowerCase() == 'alias' || doc.type.toLowerCase == 'aliastransformation')) {
      emit(doc.uniqueId, {
		"aliasOf":            doc.aliasOf,
	    "id" :                doc._id,
		"localUniqueId":      doc.localUniqueId,
		"notes":	          doc.notes,
		"termLabel":          doc.termLabel,
 		"type":               doc.type,
		"uniqueId":           doc.uniqueId
      });
  }
};
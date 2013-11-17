function(doc) {
    if (doc) {
      emit(doc.uniqueId, {
	    "id" :                 doc._id,
        "aliasOf":             doc.aliasOf,
		"defaultValue":        doc.defaultValue,
		"definition":	       doc.definition,
		"localUniqueId":       doc.localUniqueId,
		"notes":	           doc.notes,
		"termLabel":           doc.termLabel,
 		"type":                doc.type,
		"uniqueId":	           doc.uniqueId,
		"uses":	               doc.uses,
		"valueSpace":          doc.valueSpace
      });
  }
};
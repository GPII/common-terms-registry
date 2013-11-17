function(doc) {
    if (doc) {
      emit(doc.uniqueId, {
	    "_id" :                doc._id,
	    "_rev" :               doc._rev,
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
function(doc) {
    if (doc && doc.type && doc.type.toLowerCase() == 'general') {
      emit(doc.uniqueId, {
	    "id" :                 doc._id,
		"defaultValue":        doc.defaultValue,
		"definition":	       doc.definition,
		"localUniqueId":       doc.localUniqueId,
		"notes":	           doc.notes,
 		"type":                doc.type,
		"uniqueId":	           doc.uniqueId,
		"uses":	               doc.uses,
		"valueSpace":          doc.valueSpace
      });
  }
};
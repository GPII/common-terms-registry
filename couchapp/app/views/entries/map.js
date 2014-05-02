function(doc) {
    if (doc) {
      emit(doc.uniqueId, {
 		"type":                 doc.type,
		"uniqueId":	            doc.uniqueId,
		"localId":              doc.localId,
		"valueSpace":           doc.valueSpace,
		"defaultValue":         doc.defaultValue,
        "aliasOf":              doc.aliasOf,
		"termLabel":            doc.termLabel,
		"definition":	        doc.definition,
		"notes":	            doc.notes,
		"uses":	                doc.uses,
		"status":	            doc.status,

        // non-canonical fields
        "source":               doc.source,
        "unreviewedComments":   doc.unreviewedComments,
        "reviewedComments":     doc.reviewedComments
      });
  }
};
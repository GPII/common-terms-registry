function(doc) {
    if (doc && (doc.type.toLowerCase() == 'alias' || doc.type.toLowerCase == 'aliastransformation')) {
      emit(doc.uniqueId, {
 		"type":       doc.type,
		"uniqueId":   doc.uniqueId,
		"localId":    doc.localId,
        "aliasOf":    doc.aliasOf,
		"notes":      doc.notes,
		"termLabel":  doc.termLabel,
		"uses":       doc.uses,
        "status":     doc.status,
        // non-canonical fields are prefixed with an underscore
        "_id" :       doc._id,
	    "_rev" :      doc._rev,
        "_source":    doc.source
      });
  }
};
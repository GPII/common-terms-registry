function(doc) {
    if (doc && (doc.type.toLowerCase() == 'alias' || doc.type.toLowerCase == 'aliastransformation') && doc.status !== "deleted") {
      emit(doc.uniqueId, {
 		"type":       doc.type,
		"uniqueId":   doc.uniqueId,
		"localId":    doc.localId,
        "aliasOf":    doc.aliasOf,
		"notes":      doc.notes,
		"termLabel":  doc.termLabel,
		"uses":       doc.uses,
        "status":     doc.status,
        // non-canonical fields
        "_id" :       doc._id,
	    "_rev" :      doc._rev,
        "source":    doc.source
      });
  }
};
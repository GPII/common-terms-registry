function(doc) {
    if (doc && doc.recordType && doc.recordType == 'term') {
      emit(doc.uniqueId, {
	    "id" : doc._id,
 		"recordType":	doc.recordType,
		"uniqueId":	doc.uniqueId,
		"localUniqueId":	doc.localUniqueId,
		"defaultValue": doc.defaultValue,
		"description":	doc.description,
		"notes":	doc.notes,
      });
  }
};
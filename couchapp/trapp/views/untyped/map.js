function(doc) {
    if (doc && (!doc.recordType || (doc.recordType != 'alias' && doc.recordType != 'term'))) {
      emit(doc._id, {
	    "id" : doc._id,
 		"recordType":	doc.recordType,
		"uniqueId":	doc.uniqueId,
		"localUniqueId":	doc.localUniqueId,
		"aliasTranslationOf": doc.aliasTranslationOf,
		"description":	doc.description,
		"groups": doc.group,
		"ids": doc.id,
		"notes":	doc.notes
      });
  }
};
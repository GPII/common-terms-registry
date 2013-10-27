function(doc) {
    if (doc && doc.recordType && doc.recordType == 'alias') {
      emit(doc.aliasTranslationOf, {
	    "id" : doc._id,
 		"recordType":	      doc.recordType,
		"userPreference":     doc.userPreference,
		"localUniqueId":      doc.localUniqueId,
		"aliasTranslationOf": doc.aliasTranslationOf,
		"defaultValue":       doc.defaultValue,
		"description":	      doc.description,
		"groups":             doc.group,
		"ids" :               doc.id,
		"notes":	      doc.notes
      });
  }
};
function(doc) { if (doc.status !== "deleted") { emit(doc.uniqueId, 1); } }

function(doc) { if (doc.status !== "deleted") { emit(doc.uniqueId.toLowerCase(), 1); } }

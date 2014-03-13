function(doc) { 
    if (!doc._id.match(/^_design/)) {
        var ret=new Document();

        var defs = "";

        var keys = Object.keys(doc);
        for (var i in keys) {
            var field = keys[i];
            if (doc[field]) {
                ret.add(doc[field],{"field":field, "store":"yes"});
                defs += " " + doc[field] + " ";
            }
        }

        // All of the data is added to the default field so that unqualified searches match any data found in the record.
        ret.add(defs,{"field":"default", "store": "yes"});

        log.debug("indexed document '" + doc.uniqueId + "'...");

        return ret;
    }
    else {
        log.debug("skipping indexing of design document '" + doc._id + "'...");
    }

    return null;
}

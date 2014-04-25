function(doc) { 
    if (!doc._id.match(/^_design/)) {
        var ret=new Document();

        var defs = "";

        var keysToStore = ["uniqueId","aliasOf","translationOf"];
        for (var i in keysToStore) {
            var field = keysToStore[i];
            if (doc[field]) {
                ret.add(doc[field],{"field":field, "store":"yes"});
                defs += " " + doc[field] + " ";
            }
        }


        var keysToIndex = ["status","notes","uses","definition","termLabel","type","source"];
        for (var i in keysToIndex) {
            var field = keysToIndex[i];
            if (doc[field]) {
                ret.add(doc[field],{"field":field, "store":"no"});
                defs += " " + doc[field] + " ";
            }
        }

        // All of the data is added to the default field so that unqualified searches match any data found in the record.
        ret.add(defs,{"field":"default", "store": "no"});

        log.debug("indexed document '" + doc.uniqueId + "'...");

        return ret;
    }
    else {
        log.debug("skipping indexing of design document '" + doc._id + "'...");
    }

    return null;
}

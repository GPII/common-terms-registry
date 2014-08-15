function(doc) { 
    if (!doc._id.match(/^_design/)) {
        var ret=new Document();

        var defs = "";

        // We have to store values we wish to use in field:value queries
        // We also include them in the value of the defaults field (used when no qualifiers are added)
        var keysToStore = ["uniqueId","aliasOf","translationOf"];
        for (var i in keysToStore) {
            var field = keysToStore[i];
            if (doc[field]) {
                ret.add(doc[field],{"field":field, "store":"yes"});
                defs += " " + doc[field] + " ";
            }
        }

        // The type and status should not be included in the defs, but should be stored
        var keysToStoreLowerCase = ["type", "status"];
        for (var i in keysToStoreLowerCase) {
            var field = keysToStoreLowerCase[i];
            if (doc[field]) {
                ret.add(doc[field].toLowerCase(),{"field":field, "store":"yes"});
            }
        }

        var keysToIndex = ["notes","uses","definition","termLabel","source"];
        for (var i in keysToIndex) {
            var field = keysToIndex[i];
            if (doc[field]) {
                ret.add(doc[field],{"field":field, "store":"no"});
                defs += " " + doc[field].toLowerCase() + " ";
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

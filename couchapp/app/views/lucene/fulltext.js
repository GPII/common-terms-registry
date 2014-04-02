{
    "by_key": {
        "defaults": { "store":"yes" },
        "index":"function(doc) { var ret=new Document(); ret.add(doc.key); return ret }"
    }
}
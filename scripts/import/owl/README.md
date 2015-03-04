The contents of this directory can be used to import an OWL file from the Semantic Analysis Tool into the Preference Terms Dictionary.  This process is meant to be used with an empty couchdb database.

First, you will need to transform the .owl file downloaded from the SAT using the included leaf_blower.xsl script and an XSLT tool, as in the following example:

    xsltproc leaf_blower.xsl > /tmp/sat.json

You would then directly import the data into your couchdb instance using a command like:

    curl -H "Content-Type: application/json" -d @/tmp/sat.json -u admin -X POST http://localhost:5984/tr/_bulk_docs


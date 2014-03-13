This directory contains a simple design document that will enable lucene integration with the Common Terms Registry.

To push this design document to a couchdb instance, run a command like the following from this directory:

    couchapp push http://username:password@localhost:5984/tr

This will create a design document called /tr/_design/lucene.

You will also need to set up couchdb-lucene and configure couch to proxy requests per the instructions here:

    https://github.com/rnewson/couchdb-lucene

Assuming that you have proxied requests using the prefix "_fti", you will be able to see if Lucene integration is working using a URL like the following:

    http://localhost:5984/_fti/local/tr/_design/lucene/by_content?q=reading&order=uniqueId

You should see a list of records where any field matches "reading" or "read" (the full search syntax is documented on the couchdb-lucene site).
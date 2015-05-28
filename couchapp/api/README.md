This directory contains just the views and record constraints that are required to configure a raw CouchDB instance for
use with the Preference Terms Dictionary API.

All code follows the "couchapp" conventions and is meant to be deployed with that tool:

https://github.com/couchapp/couchapp

To push these design documents to a couchdb instance, run a command like the following from this directory:

    couchapp push http://username:password@localhost:5984/tr

If you have run this command correctly, a request like the following should return output:

    curl http://localhost:5984/tr/_design/api/_view/terms
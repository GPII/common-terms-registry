This directory contains Couchdb views that are meant to assist in identifying duplicate records in the Preference Terms Dictionary.

All code follows the "couchapp" conventions and is meant to be deployed with that tool:

https://github.com/couchapp/couchapp

To push these design documents to a couchdb instance, run a command like the following from this directory:

    couchapp push http://username:password@localhost:5984/tr

If you have run this command correctly, a request like the following should return output:

    curl http://localhost:5984/_users/_design/dupes/_view/email

For a full list of available views, just look at the contents of the `` directory.
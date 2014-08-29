This directory contains the prototype front end and REST interfaces for the terms registry.  It is in the process of being replaced with Express.  If you would like to look at the old interface for reference, keep in mind that a lot of the supporting structures (views, etc.) have changed and that it's not likely to actually work.

All code follows the "couchapp" conventions and is meant to be deployed with that tool:

https://github.com/couchapp/couchapp

To push this app to a couchdb instance, run a command like the following from this directory:

    couchapp push http://username:password@localhost:5984/tr

In most cases, you will need to obtain or create a data set before this app will be useful.

Although there are synchronization options built into couchdb, the least dangerous way to obtain the required data is to:

1. Download the current data using a command like:
        curl http://username:password@hostname:port/tr/_all_docs?include_docs=true > data.json

2. Edit the output, remove the design docs, and rename the main "rows" variable to "docs" (required for a bulk import).

3. Bulk upload the data using a command like:
        curl -d @data.json -X POST http://username:password@localhost:5984/tr/_bulk_docs -H "Content-Type: application/json"

In order to be able to log in, you will also need to configure and start the "lockit" user management server in the "lockit" directory under the root of the source tree.


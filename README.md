# Introduction

The terms registry is intended to help people describing needs and solutions translate between the range of terms used to describe both.  

The registry consists of canonical entries and aliases from other namespaces.

## Requirements

To set up a development instance of the registry, you will need:

* [CouchDB](http://couchdb.apache.org/)
* [couchdb-lucene](https://github.com/rnewson/couchdb-lucene)
* [node.js](http://nodejs.org/)
* [bower](http://bower.io/)
* [the "couchapp" python script](https://github.com/couchapp/couchapp)

## Getting test data

To really test things, you will probably want some real data.  You can either do this by:

1. Replicating from another instance:  http://wiki.apache.org/couchdb/Replication
2. Building the data set from the source materials using the contents of the scripts folder (see that folder for instructions).

If you are replicating from another instance, you will need to do this *before* installing any couchapps.

# Installation instructions

## CouchDB

Before you can do anything else, you need to install and configure CouchDB to your liking.  There are no unique requirements imposed by this app, you should be able to use standard packaged versions of CouchDB.

## The legacy "couchapp" interface

To install the legacy interface (in the "couchapp/app" directory), you need to:

1. Run "npm install" from the _lockit_ directory.
2. Run the scripts in the "lockit/node_modules/lockit" directory to add required views to the _\_users_ database
3. Start the "lockit" instance of express (node lockit/app.js).
4. Push the "app" couchapp to your database following the instructions in that directory.

Once you have done this, you should see the legacy interface at:

http://localhost:couch_port/database/_design/app/index.html

## The new "express" interface

To install the new interface (in the "express" directory), you need to:

1. Run "npm install" in the _express_ subdirectory.
2. Run the scripts in the "express/node_modules/express-couchuser" directory to add required views to the _\_users_ database
3. Set up couchdb-lucene using the instructions on their site and in the "couchapp/lucene" directory.
4. Push the "lucene" couchapp to your database following the instructions in that directory.
5. Push the "api" couchapp to your database following the instructions in that directory.
6. Check the configuration files in express/configs/express and update as needed for your environment.
7. Run bower from the _express_ directory to install the client side dependencies in _express/public/bc_.
8. Start up the standalone express instance (cd express; node app)

Once you have done this, you should see the new interface at:

http://localhost:express_port/
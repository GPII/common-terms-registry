# A simple, very lowlevel CouchDB module, which uses promises

only basic get, add, update functionality for now

## Usage:

``` javascript
var CouchDB = require( 'promised-couch' ).CouchDB
var db = CouchDB( { base: 'http://user:password@127.0.0.1:5984/some-db/' } )

// get one doc:
db.get( 'some-doc-id' ).then( function success( doc ) { }, function error( err ) {} )

// get result of a view:
db.get( '_design/whatever/_view/someview', { key: 'blabla' } ).then( ... )

// add a document:
db.put( { somekey: 'somevalue' } ).then( ... )

// add a document with some id:
db.put( { somekey: 'somevalue' }, 'some-id' ).then( ... )

// update a document:
db.put( { _id: 'some-id', _rev: 'some-rev', somekey: 'somevalue' } ).then( ... )
```

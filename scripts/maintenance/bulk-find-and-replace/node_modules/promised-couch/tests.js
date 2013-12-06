#!/usr/bin/env node

var promise = require( 'promised-io/promise' )
var assert = require( 'assert' )
var request = require( 'promised-request' )
var CouchDB = require( './main' ).CouchDB

//var TESTDB = 'http://127.0.0.1:5984/promised-couch-test/'
if( !process.argv[ 2 ] ) {
    console.info( 'usage: ./tests.js http://user:password@127.0.0.1:5984/some-db/' )
    process.exit( 1 )
}

var TESTDB = process.argv[ 2 ]

function setup( ) {
    return request( { uri: TESTDB, method: 'DELETE' } )
    .then( function( result ) {
        return request( { uri: TESTDB, method: 'PUT' } )
    } )
}

function setupSimpleView( ) {
    return setup( ).then( function( ) {
        return db.put( {
            _id: '_design/test',
            language: 'javascript',
            views: {
                test: {
                    map: function( doc ) {
                        if( doc.type === 'test' ) {
                            emit( doc.strNumber, null )
                        }
                    }
                }
            }
        } )
    } )
    .then( function( ) {
        return promise.all(
            [ 1, 2, 3, 4 ].map( function( number ) { 
                return db.put( { type: 'test', strNumber: number.toString( ) } ) 
            } )
        )
    } )
}

var db = CouchDB( { base: TESTDB } )

var tests = [
    function allDocs( ) {
        return setup( ).then( function( ) {
            return db.get( '' )
            .then( function( result ) {
                assert.equal( result.doc_count, 0 )
            } )
        } )
    },
    function error( ) {
        return setup( ).then( function( ) {
            return db.get( 'NOTEXISTING' )
            .addErrback( function( err ) {
                assert.equal( err.statusCode, 404 )
            } )
        } )
    },
    function getOneDoc( ) {
        return setup( ).then( function( ) {
            return request( { uri: TESTDB + 'a-doc', method: 'PUT', body: JSON.stringify( { name: 'first doc' } ) } )
        } )
        .then( function( ) {
            return db.get( 'a-doc' )
            .then( function( doc ) {
                assert.equal( doc.name, 'first doc' )
            } )
        } )
    },
    function testPut( ) {
        return setup( ).then( function( ) {
            return db.put( { name: 'puttest', testFunction: function( ){ } } )
            .then( function( result ) {
                return db.get( result.id )
            } )
            .then( function( doc ) {
                assert.ok( doc.testFunction )
            } )
        } )
    },
    function viewWithOneKey( ) {
        return setupSimpleView( )
        .then( function( ) {
            return db.get( '_design/test/_view/test', { key: '2' } )
        } )
        .then( function( result ) {
            assert.equal( result.rows.length, 1 )
            assert.equal( result.rows[ 0 ].key, '2' )
        } )
    },
    function keyRange( ) {
        return setupSimpleView( )
        .then( function( ) {
            return db.get( '_design/test/_view/test', { startkey: '2', endkey: '3' } )
        } )
        .then( function( result ) {
            assert.equal( result.rows.length, 2 )
        } )
    },
    function includeDocs( ) {
        return setupSimpleView( )
        .then( function( ) {
            return db.get( '_design/test/_view/test', { include_docs: true } )
        } )
        .then( function( result ) {
            assert.equal( result.rows[ 0 ].doc.strNumber, '1' )
        } )
    },
    function putUpdate( ) {
        return setup( ).then( function( ) {
            var id;
            return db.put( { name: 'updatetest' } )
            .then( function( result ) {
                id = result.id;
                return db.get( result.id )
            } )
            .then( function( doc ) {
                doc.name = 'updatetest2'
                return db.put( doc )
            } )
            .then( function( result ) {
                assert.ok( result.ok )
                assert.equal( result.id, id )
            } )
        } )
    },
    function del( ) {
        return setup( ).then( function( ) {
            return db.put( { name: 'puttest', tmp: true, } )
            .then( function( result ) {
                return db.get( result.id )
            } )
            .then( function( doc ) {
                return db.del( doc )
            } )
            .then( function( result ) {
                assert.ok( result.ok )
            } )
        } )
    }
]

promise.seq( tests, null )

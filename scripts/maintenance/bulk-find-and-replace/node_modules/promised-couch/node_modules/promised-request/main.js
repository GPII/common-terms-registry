var promise = require( 'promised-io/promise' );
var orig_request = require( 'request' );

module.exports = function( options ) {
    var deferred = new promise.Deferred( );
    var callback = function( error, response ) {
        if( error ) {
            deferred.emitError( error );
        } else {
            deferred.emitSuccess( response );
        }
    }
    orig_request( options, callback );
    return deferred.promise;
};

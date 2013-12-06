var request = require( 'promised-request' )

exports.CouchDB = function( options ) {
    var self = {}
    function init( ) {
        self.base = options.base
        var hasSlashAtEnd = self.base[ self.base.length -1 ] === '/'
        if( !hasSlashAtEnd ) {
            self.base = self.base + '/'
        }
        return self
    }
    self.get = function( path, qs ) {
        return self._request( path, { qs: qs } )
    }
    self.put = function( doc, path ) {
        if( !path ) {
            if( doc._id ) {
                path = doc._id
            } else {
                path = self._uuid( )
            }
        }
        return self._request( path, { method: 'PUT', body: doc } )
    }
    self.del = function( doc ) {
        return self._request( doc._id, { method: 'DELETE', qs: { rev: doc._rev } } );
    }
    self._request = function( path, options ) {
        options = options || {}
        var qs = options.qs || {}
        var url = self.base + path
        ;[ 'key', 'startkey', 'endkey', 'keys' ].forEach( function jsonify( key ) {
            if( qs[ key ] ) {
                qs[ key ] = JSON.stringify( qs[ key ] )
            }
        } )
        var body;
        if( options.body ) {
            body = JSON.stringify( options.body, function( key, value ) {
                if( typeof( value ) === 'function' ) {
                    return value.toString( )
                }
                return value
            } )
        }
        return request( { uri: url, qs: qs, json: true, method: options.method || 'GET', body: body } )
        .then( function( result ) {
            if( result.statusCode === 200 || result.statusCode === 201 ) {
                return result.body
            } else {
                if( result.statusCode == 404 ) {
                    throw( { message: 'not found', statusCode: 404, more: request } )
                } else {
                    throw( { message: 'error: ' + result.statusCode, statusCode: result.statusCode, more: result } )
                }
            }
        } )
    }
    self._uuid = function( ) {
        var HEX_RADIX = 16
        function _generateRandomEightCharacterHexString( ) {
            var random32bitNumber = Math.floor( ( Math.random( ) % 1 ) * Math.pow( 2, 32 ) )
            var eightCharacterHexString = random32bitNumber.toString( HEX_RADIX )
            while( eightCharacterHexString.length < 8 ) {
                eightCharacterHexString = "0" + eightCharacterHexString
            }
            return eightCharacterHexString
        }
        var versionCodeForRandomlyGeneratedUuids = "4"
        var variantCodeForDCEUuids = "8"
        var a = _generateRandomEightCharacterHexString( )
        var b = _generateRandomEightCharacterHexString( )
        b = b.substring( 0, 4 ) + versionCodeForRandomlyGeneratedUuids + b.substring( 5, 8 )
        var c = _generateRandomEightCharacterHexString( )
        c = variantCodeForDCEUuids + c.substring( 1, 4 ) + c.substring( 4, 8 )
        var d = _generateRandomEightCharacterHexString( )
        var returnValue = a + b + c + d
        returnValue = returnValue.toLowerCase( )
        return returnValue
    }
    return init( )
}

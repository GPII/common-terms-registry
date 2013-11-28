# A wrapper for Mikeals request module, that returns a promise

Usually you can use promised-io.promise.convertNodeAsyncFunction to convert any
function to a promise returning function. But convertNodeAsyncFunction is smart
and figures out that request returns two success values - response and body -
and therefore emits an array. since you can get to the body argument of request also
by response.body, that is the only success value you need. and that is what this
wrapper method does.


## Usage:

``` javascript
var request = require( 'promised-request' );
request( 'http://sifu.io' ).then( function( response ) { console.info( resonse.body ) } );
```

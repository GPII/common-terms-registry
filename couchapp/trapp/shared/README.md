These resources are accessible from both couch itself (views, lists,
shows, etc.) and from the client side.

On the server side, these can be accessed using conventions like the
following:

1.  Couch include syntax: `//!code shared/evolver.js`
2.  Node.js style requires: `require('shared/evolver.js');`

On the client side, these can be access via the properties of the
design document for the couchapp.   Here is an example of code that does this:

`$.couch.db('tr').openDoc('_design/trapp',{success: function(data, textStatus, jqXHR) {
    $(data.shared).each(function (position,entry) {
        $(Object.keys(entry)).each(function(position,key) {
            $.globalEval(entry[key]);
        });
    });
}});`

Once this is run, a function defined in a javascript file found in the
shared directory would be available globally.
function(doc,req) {
    var Mustache = require('vendor/couchapp/lib/mustache');
    var data = {};
    if (doc !== null && doc !== undefined) { data = doc; }

    return Mustache.to_html(this.templates.edit, data);
}
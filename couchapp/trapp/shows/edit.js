function(doc,req) {
    var handlebars = require('vendor/handlebars/lib/handlebars');
    var data = {};
    if (doc !== null && doc !== undefined) { data = doc; }

    return handlebars.compile(this.templates.edit)(data);
}
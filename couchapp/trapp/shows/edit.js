function(doc,req) {
    var handlebars = require('vendor/handlebars/lib/handlebars');
    handlebars.registerHelper('json', function(context) {
        return JSON.stringify(context);
    });

    //!code shared/evolver.js
    var data = {};
    if (doc !== null && doc !== undefined) { data = doc; evolve(data);}

    var bodyString = "<body>"+ handlebars.compile(this.templates.edit_body)(data) + "</body>";
    var headString = "<head>" + handlebars.compile(this.templates.edit_header)(data) + "</head>";
    var htmlString = "<html>" + headString + bodyString + "</html>";

    return htmlString;
}
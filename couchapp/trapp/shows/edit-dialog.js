function(doc,req) {
    var handlebars = require('vendor/handlebars/lib/handlebars');
    handlebars.registerHelper('json', function(context) {
        return JSON.stringify(context);
    });

    //!code includes/edit-common.js

    var bodyString = "<body>"+ handlebars.compile(this.templates.edit_body)(data) + "</body>";
    var headString = "<head>" + handlebars.compile(this.templates.edit_header)(data) + handlebars.compile(this.templates.edit_header_dialog)(data) +"</head>";
    var htmlString = "<html>" + headString + bodyString + "</html>";

    return htmlString;
}
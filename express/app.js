
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var exphbs  = require('express3-handlebars');

var templateDir = path.join(__dirname, 'templates');

var app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// all environments
app.set('port', process.env.PORT || 4895);
app.set('views', path.join(__dirname, 'views'));
// Required for session storage
app.use(express.cookieParser());
app.use(express.session({ secret: 'Printer, printer take a hint-ter.'}));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Most static content including root page
app.use(express.static(__dirname + '/public'));

// REST APIs
app.get('/api', routes.api);

// /api/user/* is provided by the express-user-couchdb package
var couchUser = require('express-user-couchdb');
app.configure(function() {
    app.use(couchUser({
        users: 'http://admin:admin@localhost:5984/_users',
        // Mail settings, for full options, check out https://github.com/andris9/Nodemailer/blob/master/lib/engines/smtp.js
        email:  {
            from: 'no-reply@raisingthefloor.org',
            service: 'SMTP',
            SMTP: {
                host: 'localhost',
                port: 25
            },
            templateDir: templateDir
        },
        app: {
            name: "Common Terms Registry"
        },
	    verify: true,
        adminRoles: [ "admin"]
    }));
});

// API Documentation
app.get('/apidocs', routes.apidocs);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

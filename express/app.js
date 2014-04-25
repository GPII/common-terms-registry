
/**
 * Module dependencies.
 */

var express = require('express');
//var routes = require('./routes');
var http = require('http');
var path = require('path');
var exphbs  = require('express3-handlebars');
// FIXME:  Using this causes the server to churn without ever returning results
//var logger = require('morgan');

var templateDir = path.join(__dirname, 'templates');

var app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var config = {
    "couch.url" : "http://admin:admin@localhost:5984/tr/",
    users: 'https://admin:admin@localhost:5984/_users',
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
};

// development only
if ('development' === app.get('env')) {
    // TODO:  Add any dev-specific settings here
// FIXME: The app hangs if we use the new error handling module
//    app.use(require('errorhandler'));
// FIXME: The app hangs if we use the new logging module
//    app.use(logger('dev'));
}
else {
    // TODO:  Add any production-specific settings here
// FIXME: The app hangs if we use the new logging module
//    app.use(logger());
}

// /api/user/* is provided by the express-user-couchdb package
var couchUser = require('express-user-couchdb');
app.use(couchUser(config));

//// all environments
app.set('port', process.env.PORT || 4895);
app.set('views', path.join(__dirname, 'views'));

// Required for session storage
// FIXME:  using these causes the server to never return anything
//app.use(require('cookie-parser'));
//app.use(require('static-favicon'));

// FIXME:  using these causes the server to never return anything
////var session = require('express-session');
////app.use(session({ secret: 'Printer, printer take a hint-ter.'}));

// FIXME:  using these causes the server to never return anything
//var bodyParser = require('body-parser');
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded());

// FIXME:  using these causes the server to never return anything
//app.use(require('method-override'));

app.use(express.static(path.join(__dirname, 'public')));

// Most static content including root page
app.use(express.static(__dirname + '/public'));

// REST APIs
var api = require('./api')(config);
app.use('/api',api);

// API Documentation
//app.get('/apidocs', routes.apidocs);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



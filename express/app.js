var express = require('express');
var http = require('http');
var path = require('path');
var exphbs  = require('express3-handlebars');
var logger = require('morgan');
var couchUser = require('express-user-couchdb');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');

var templateDir = path.join(__dirname, 'templates');

var app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var config = {
    // TODO:  test these and break down into dev and production settings
    "couch.url" : "http://admin:admin@localhost:5984/tr/",
    users: 'http://admin:admin@localhost:5984/_users',
    "lucene.url" : "http://localhost:5984/_fti/local/tr/_design/lucene/by_content",
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
    app.use(logger('dev'));
}
else {
    // TODO:  Add any production-specific settings here
    app.use(logger());
}

//// all environments
app.set('port', process.env.PORT || 4895);
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
// Required for session storage, must be called before session()
app.use(cookieParser());
app.use(session({ secret: 'Printer, printer take a hint-ter.'}));

// /api/user/* is provided by the express-user-couchdb package
app.use(couchUser(config));

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



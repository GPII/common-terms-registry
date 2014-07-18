"use strict";

var express = require('express');
var http = require('http');
var path = require('path');
var exphbs  = require('express3-handlebars');
var logger = require('morgan');
var couchUser = require('express-user-couchdb');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var config = {};

var loader = require("./configs/lib/config-loader");
if ('development' === app.get('env')) {
    config = loader.loadConfig(require("./configs/express/dev.json"));
    app.use(logger('dev'));
}
else {
    config = loader.loadConfig(require("./configs/express/prod.json"));
    app.use(logger('dev'));
}

config.templateDir = path.join(__dirname, 'templates');

app.set('port', config.port || process.env.PORT || 4895);
app.set('views', path.join(__dirname, 'views'));

// TODO:  Move to modules that require this if possible
app.use(cookieParser()); // Required for session storage, must be called before session()
app.use(session({ secret: config.session.secret}));

// /api/user/* is provided by the express-user-couchdb package
app.use("/", couchUser(config));

// Mount the JSON schemas separately so that we have the option to decompose them into a separate module later, and so that the doc links and web links match
app.use("/schema",express.static(__dirname + '/schema/schemas'));

// REST APIs
var api = require('./api')(config);
app.use('/api',api);

// Code to detect and suggest fixes for duplicates, only enabled in the development environment
if ('development' === app.get('env')) {
    var dupes = require('./dupes')(config);
    app.use('/dupes',dupes);
}


app.use(express.static(path.join(__dirname, 'public')));

// Most static content including root page
app.use(express.static(__dirname + '/public'));

// Mount the infusion source from our node_modules directory
app.use("/infusion",express.static(__dirname + '/node_modules/infusion/src'));

// Handlebars templates for main interface
app.use("/",function(req,res) {
    res.render('index');
});


http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});



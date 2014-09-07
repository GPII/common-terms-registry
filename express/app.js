"use strict";

var express = require('express');
var http = require('http');
var path = require('path');
var exphbs  = require('express-handlebars');
var logger = require('morgan');
var couchUser = require('express-user-couchdb');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
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

// Email templates
config.email.templateDir = path.join(__dirname, 'templates/email');
config.viewTemplateDir   = path.join(__dirname, 'views');

app.set('port', config.port || process.env.PORT || 4895);
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser()); // Required for session storage, must be called before session()
app.use(session({ secret: config.session.secret}));


// Mount the JSON schemas separately so that we have the option to decompose them into a separate module later, and so that the doc links and web links match
app.use("/schema",express.static(__dirname + '/schema/schemas'));

// /api/user/* is provided by the express-user-couchdb package, which requires an application that supports body parsing.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/", couchUser(config));

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

// Mount the handlebars templates as a single dynamically generated source file
app.use("/hbs",require("./views/client.js")(config));

// Detail edit/view for an individual record.  Requires a separate interface because the uniqueId is passed as part of the path
app.get("/details/:uniqueId", function(req,res) {
    var options = { user: req.session.user};
    exposeRequestData(req,options);

    if (req.params.uniqueId === "new") {
        if (req.session.user) {
            // Use the record defaults from our configuration
            var record = config["record.defaults"];

            // Add support for prepopulating the link to the parent record for aliases, translations, etc. using query variables
            var fieldsToPrepopulate = ["aliasOf","translationOf", "type"];
            fieldsToPrepopulate.forEach(function(field){
                if (req.query[field]) {
                    record[field] = req.query[field];
                }
            });

            options.layout = 'details';
            options.record = record;
            res.render('pages/details', options);
        }
        else {
            options.message = "You must be logged in to create new records.";
            res.render('pages/error', options);
        }
    }
    else {
        options.layout = 'details';
        options.record = { uniqueId: req.params.uniqueId };
        res.render('pages/details', options);
    }
});

// TODO:  Add support for "history" list
// TODO:  Add support for "diff" view

// Many templates simply require user information.  Those can all be loaded by a common function that:
// 1. Uses views/layouts/PATH.handlebars as the layout if it exists, "page" if it doesn't.
// 2. Uses views/pages/PATH.handlebars for the body if it exists
// 3. Displays an error if a nonsense path is passed in.
app.use("/",function(req,res) {
    var fs = require("fs");

    var options = { user: req.session.user};
    exposeRequestData(req,options);

    var path = req.path === "/" ? "search" : req.path.substring(1);
    if (fs.existsSync(__dirname + "/views/pages/" + path + ".handlebars")) {
        options.layout = fs.existsSync(__dirname + "/views/layouts/" + path + ".handlebars") ? path : "main";
        res.render('pages/' + path, options);
    }
    else {
        res.status(404).render('pages/error', {message: "The page you requested was not found."});
    }
});

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

// Expose whatever data the user has included to our template handling
function exposeRequestData(req,options) {
    if (req.path)    { options.path    = req.path;}
    if (req.params)  { options.params  = req.params;}
    if (req.body)    { options.body    = req.body;}
    if (req.query)   { options.query   = req.query;}
    if (req.cookies) {
        var safeCookies = {};
        config.safeCookies.forEach(function(key){
            if (req.cookies[key]) {
                var value = "";
                try {
                    value = JSON.parse(req.cookies[key]);
                } catch(e) {
                    value = req.cookies[key];
                }
                safeCookies[key] = value;
            }
        });
        if (Object.keys(safeCookies).length > 0) {
            options.cookies = JSON.stringify(safeCookies);
        }
    }
}
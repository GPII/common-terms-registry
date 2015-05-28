// A temporary script to set up the views required for express-user-couchdb

// TODO:  Move to Grunt
var userSetup = require('./node_modules/express-user-couchdb/init');
userSetup('http://admin:admin@localhost:5984/_users', function(err) {
	console.log("configured express-user-couchdb module");
});


// A convenience utility to import our couchapp views into a pouchdb instance, required for testing purposes.
// Converts a series of couchapp directories into a single view like:
//
// "_id": "_design/api",
//    "views": {
//      "flat": {
//          "map": "function()...."
//      },
//      "etc": { "map": ... }
//  },
// "validate_doc_update": "function() ...."

"use strict";

function loadCouchappViews(path) {
    var fs = require("fs");

    var requireRegexp = /require\(\'views\/lib\/recordUtils\'\)\.getRecordFields\(doc\)/g;

    var json = { "_id": "_design/api", "views": {}};

    // read the "validate_doc_update.js file
    var validateContent = fs.readFileSync(path + "validate_doc_update.js", {"encoding": "utf8"});
    json.validate_doc_update = validateContent;

    // read the couchapp parent directory
    fs.readdirSync(path + "/views").forEach(function(file){
        // skip the library directory that we already scanned...
        if (file !== "lib") {
            var mapContent = fs.readFileSync(path + "/views/" + file + "/map.js", {"encoding": "utf8"});

            // replace require('views/lib/recordUtils').getRecordFields with the raw object
            // This is probably bad and I should probably feel bad, but pouch can't handle the raw views.
            mapContent = mapContent.replace(requireRegexp,"doc");

            json.views[file] = {"map": mapContent};
        }
    });

    return json;
}

module.exports = function(config) {
    var fluid = require('infusion');
    var couchapp = fluid.registerNamespace("gpii.ctr.api.tests.lib.couchapp");

    couchapp.loadCouchappViews = loadCouchappViews;
    return couchapp;
};
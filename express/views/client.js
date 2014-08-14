// A convenience library to serve up the contents of the templates directory as a single HTML file with named blocks
"use strict";

module.exports = function(config) {
    var fs = require('fs');
    var fluid = require('infusion');

    var templates = fluid.registerNamespace("gpii.ctr.templates");
    templates.hbsExtensionRegexp = /^(.+)\.(?:hbs|handlebars)$/;
    templates.hbsScriptRegexp = /(script>)/g;
    templates.cache = {};
    templates.html = "";

    var express = require('express');
    var app = express();

    function loadTemplates(dir, res) {
        var dirContents = fs.readdirSync(dir);
        console.log(JSON.stringify(dirContents));
        dirContents.forEach(function(entry){
            var path = dir + "/" + entry;
            var stats = fs.statSync(path);
            if (stats.isFile()) {
                var matches = templates.hbsExtensionRegexp.exec(entry);
                if (matches) {
                    var templateType = dir.indexOf("partials") !== -1 ? "partial" : "template";
                    var key =  templateType + "-" + matches[1];

                    // cache file information so that we only reload templates that have been updated
                    if (templates.cache[key] && stats.mtime.getTime() === templates.cache[key].mtime.getTime()) {
                        console.log("Skipping cached " + templateType + " '" + key + "'...");
                    }
                    else {
                        templates.updated = true;
                        templates.cache[key] = {
                            mtime: stats.mtime,
                            content: fs.readFileSync(path)
                        };
                    }
                }
            }
            else if (stats.isDirectory()) {
                // call the function recursively for each directory
                loadTemplates(path,res);
            }
        });
    }

    function wrapTemplate(key, content) {
        // We have to pseudo-escape script tags to avoid them breaking our templates.
        return '<script id="' + key + '" type="text/x-handlebars-template">' + content.toString().replace(templates.hbsScriptRegexp,"{{!}}$1") + "</script>\n\n";
    }

    app.get("/", function(req,res) {
        templates.updated = false;
        loadTemplates(config.viewTemplateDir, res);

        if (templates.updated) {
            console.log("Generating html output...");
            templates.html = "";
            Object.keys(templates.cache).forEach(function(key){
                templates.html += wrapTemplate(key,templates.cache[key].content);
            });
        }
        else {
            console.log("Sending cached html output...");
        }

        res.send(200,templates.html);
    });

    return app;
};
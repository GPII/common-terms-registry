module.exports = function(config) {
    var express = require('express');
    var router = express.Router();

    var search = require('./search')(config);
    router.use('/search', search);

    var suggestConfig = JSON.parse(JSON.stringify(config));
    suggestConfig.lookup = true;

    var suggest = require('./search')(suggestConfig);
    router.use('/suggest', suggest);

    // Record lookup end points, one for all types, and one each per type
    var records = require('./records')(config);
    router.use('/records', records);

    var termsConfig = JSON.parse(JSON.stringify(config));
    termsConfig.recordType = "general";
    var terms = require("./records")(termsConfig);
    router.use('/terms', terms);

    var aliasConfig = JSON.parse(JSON.stringify(config));
    aliasConfig.recordType = "alias";
    var aliases = require("./records")(aliasConfig);
    router.use('/aliases', aliases);

    var transformConfig = JSON.parse(JSON.stringify(config));
    transformConfig.recordType = "transform";
    var transforms = require("./records")(transformConfig);
    router.use('/transforms', transforms);

    var translationConfig = JSON.parse(JSON.stringify(config));
    translationConfig.recordType = "translation";
    var translations = require("./records")(translationConfig);
    router.use('/translations', translations);

    var operatorsConfig = JSON.parse(JSON.stringify(config));
    operatorsConfig.recordType = "operator";
    var operators = require("./records")(operatorsConfig);
    router.use('/operators', operators);

    var record = require('./record')(config);
    router.use('/record', record);

    // Display the API docs for everything else
    router.use("/",function(req, res) {
        var marked = require('marked');

        var markdown = "";
        var fs = require('fs');
        var BUF_LENGTH = 64*1024;
        var buffer = new Buffer(BUF_LENGTH);
        var mdFile = fs.openSync(__dirname + "/ctr.md", 'r');
        var bytesRead = 1;
        var pos = 0;
        while (bytesRead > 0) {
            bytesRead = fs.readSync(mdFile, buffer, 0, BUF_LENGTH, pos);
            markdown += buffer.toString('utf8', 0, bytesRead);
            pos += bytesRead;
        }
        fs.closeSync(mdFile);

        res.render('api', { "title": "API Documentation", "code": marked(markdown)});
    });

    return router;
};


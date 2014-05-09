module.exports = function(config) {
    var express = require('express');
    var router = express.Router();

    var search = require('./search')(config);
    router.use('/search', search);

    var suggestConfig = JSON.parse(JSON.stringify(config));
    suggestConfig.lookup = true;

    var suggest = require('./search')(suggestConfig);
    router.use('/suggest', suggest);

    // TODO:  Add a redirect to the api docs if someone request the root of the API, or at least an informative note.
    router.use("/",function(req, res) {
        var marked = require('marked');
        marked.setOptions({
            renderer: new marked.Renderer(),
            gfm: true,
            tables: true,
            breaks: true,
            pedantic: false,
            sanitize: true,
            smartLists: true,
            smartypants: false
        });

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

        // TODO: Bring in standard headers and footers
        res.send(marked(markdown));
    });

    return router;
}


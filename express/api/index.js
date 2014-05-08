module.exports = function(config) {
    var express = require('express');
    var router = express.Router();

    var search = require('./search')(config);
    router.use('/search', search);

    var suggestConfig = JSON.parse(JSON.stringify(config));
    suggestConfig.lookup = true;

    var suggest = require('./improved-search')(suggestConfig);
    router.use('/suggest', suggest);

    // TODO:  Add a redirect to the api docs if someone request the root of the API, or at least an informative note.
    router.use("/",function(req, res) {
        debugger;   
        res.send("Hello, API world!");
    });

    return router;
}


module.exports = function(config) {
    var express = require('express');
    var router = express.Router();

    // TODO:  Add the required caches for both search and suggest to the config

    var search = require('./search')(config);
    router.use('/search', search);

    // TODO:  initialize "suggest" with a more limited config
//    var suggest = require('search')(config);
//    app.get('/suggest', suggest);

    // TODO:  Add a redirect to the api docs if someone request the root of the API, or at least an informative note.
    router.get("/",function(req, res, next) { res.send("Hello, API world!"); next(); });

    return router;
}


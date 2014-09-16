/* Library to expose the data that Express already knows about to the client-side via JSON data embedded in the markup. */
module.exports = function(config) {
    "use strict";
    var fluid = require('infusion');
    var data = fluid.registerNamespace("gpii.ctr.lib.data");

    data.exposeRequestData = function (req,options) {
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
    };

    return data;
};


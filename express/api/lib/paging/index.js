// Library to add consistent handling of paging (slicing arrays, etc.)
"use strict";

module.exports = function(config,parent) {
    var fluid = require('infusion');
    var paging = fluid.registerNamespace("gpii.ctr.api.lib.paging");

    function pageArray(array, params) {
        if (params.offset === 0 && params.limit === -1 ) {
            return array;
        }
        if (params.limit === -1 ) {
            return array.slice(params.offset);
        }
        else {
            return array.slice(params.offset, params.offset + params.limit);
        }
    }

    // Expose the paging function
    paging.pageArray = pageArray;

    return paging;
};
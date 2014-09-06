// Library to add consistent handling of sorting

"use strict";

module.exports = function(config) {
    var fluid   = require('infusion');
    var sorting = fluid.registerNamespace("gpii.ctr.api.lib.sorting");

    sorting.generateSortFunction = function (sortParams) {
        return function(a,b) {
            // TODO:  Add tests and figure out why compound sorting isn't working
            if (sortParams instanceof Array) {
                sortParams.forEach(function(rawParam){
                    var param     = sorting.getParam(rawParam);
                    var direction = sorting.getDirection(rawParam);

                    if (!a[param] && b[param])         { return -1 * direction; }
                    else if (a[param]  && !b[param])   { return  1 * direction; }
                    else if (a[param] < b [param])     { return -1 * direction; }
                    else if (a[param] > b [param])     { return  1 * direction; }
                });
            }
            else {
                var param     = sorting.getParam(sortParams);
                var direction = sorting.getDirection(sortParams);

                if (a[param] === b[param])         { return 0; }
                else if (!a[param] && b[param])    { return -1 * direction; }
                else if (a[param]  && !b[param])   { return  1 * direction; }
                else if (a[param] < b [param])     { return -1 * direction; }
                else if (a[param] > b [param])     { return  1 * direction; }
            }

            return 0;
        };
    };

    sorting.getParam = function(rawParam) {
        var matches = rawParam.match("^\\\\(.+)$");
        if (matches) {
            return matches[1];
        }

        return rawParam;
    };

    sorting.getDirection = function(rawParam) {
        var matches = rawParam.match("^\\\\(.+)$");
        if (matches) {
            return -1;
        }

        return 1;
    };

    return sorting;
};
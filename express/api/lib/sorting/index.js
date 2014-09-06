// Library to add consistent handling of sorting

"use strict";

module.exports = function(config) {
    var fluid   = require('infusion');
    var sorting = fluid.registerNamespace("gpii.ctr.api.lib.sorting");

    sorting.sort        = function (array, sortParams) {
        if (sortParams instanceof Array) {
            sorting.sortByArray(array,sortParams);
        }
        else {
            sorting.sortByValue(array,sortParams);
        }
    };

    sorting.sortByArray = function (array, sortParams) {
        // Sort by the list of params in reverse order
        try {
            var parameters = JSON.parse(JSON.stringify(sortParams));
            var param;
            while (param = parameters.pop()) {
                sorting.sortByValue(array,param);
            }
        }
        catch (e) {
            console.log("Tried to run sortByArray with a string.  Can't continue.");
        }
    };

    sorting.sortByValue = function (array, sortParams) {
        array.sort(sorting.generateSortFunction(sortParams));
    };


    sorting.generateSortFunction = function (rawParam) {
        return function(a,b) {
            var param     = sorting.getParam(rawParam);
            var direction = sorting.getDirection(rawParam);

            if (a[param] === b[param])         { return 0; }
            else if (!a[param] && b[param])    { return -1 * direction; }
            else if (a[param]  && !b[param])   { return  1 * direction; }
            else if (a[param] < b [param])     { return -1 * direction; }
            else if (a[param] > b [param])     { return  1 * direction; }

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
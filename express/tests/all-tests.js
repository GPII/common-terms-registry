"use strict";
var fluid = require('infusion'),
    kettle = fluid.require("kettle", require);

fluid.require("kettle/test/utils/js/KettleTestUtils", require);

var testIncludes = [
    // Run all tests included in the list.
    "../api/search/tests/search-and-suggest.js"
];
var tests = [];

fluid.each(testIncludes, function (path) {
    tests = tests.concat(fluid.require(path, require));
});

fluid.test.runTests(tests);
// Tests for the "paging" module.
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.tests.paging");

require("../../lib/paging");

var jqUnit = require("jqUnit");

gpii.ptd.api.tests.paging.runTests = function(that) {
    jqUnit.module("Testing paging functions...");

    // Test paging with the defaults (empty params)
    jqUnit.test("Test paging with no param data (i.e using the defaults)...", function() {
        var paged = that.pager.pageArray(that.options.testArray);
        jqUnit.assertDeepEq("If we do not pass any parameters, the original data should be returned unaltered.", that.options.testArray, paged);
    });

    jqUnit.test("Test paging with the `limit` parameter disabled...", function() {
        var results0 = that.pager.pageArray(that.options.testArray, {offset: 0,   limit: -1});
        var results50 = that.pager.pageArray(that.options.testArray, {offset: 50,  limit: -1});

        jqUnit.assertDeepEq("If the limit is disabled, the last entry should be the same no matter where we start.", results0[results0.length - 1], results50[results50.length - 1]);
    });

    jqUnit.test("Test non-overlapping sets of pages...", function(){
        var begin1 =  that.pager.pageArray(that.options.testArray, {offset: 0,   limit: 1});
        var begin2 =  that.pager.pageArray(that.options.testArray, {offset: 1,   limit: 1});

        jqUnit.assertDeepNeq("Two non-overlapping pages at the beginning of the original array should be different", begin1, begin2);

        var end1 =  that.pager.pageArray(that.options.testArray, {offset: that.options.testArray.length - 2,   limit: 1});
        var end2 =  that.pager.pageArray(that.options.testArray, {offset: that.options.testArray.length - 1,   limit: 1});

        jqUnit.assertDeepNeq("Two non-overlapping pages at the end of the original array should be different", end1, end2);
    });

    jqUnit.test("Test an overlapping set of pages....", function(){
        var firstLeaf = that.pager.pageArray(that.options.testArray, {offset: 25, limit: 2 });
        var secondLeaf = that.pager.pageArray(that.options.testArray, {offset: 26, limit: 1 });

        jqUnit.assertDeepEq("The end of the first page should match the beginning of the next...", firstLeaf[firstLeaf.length -1 ], secondLeaf[0]);
    });

    jqUnit.test("Test nested paging....", function(){
        var firstNestedResult  = that.pager.pageArray(that.pager.pageArray(that.options.testArray, {offset: 100, limit: 100 }), {offset: 50, limit: 13 });
        var secondNestedResult = that.pager.pageArray(that.pager.pageArray(that.options.testArray, {offset: 150, limit: 50 }),  {offset: 0,  limit: 13 });

        jqUnit.assertDeepEq("The end of the first page should match the beginning of the next...", firstNestedResult, secondNestedResult);
    });

    jqUnit.test("Test paging through non-array values...", function(){
        var unacceptable = {
            "a map": { foo: "bar", baz: "qux", quux: "corge", grault: "garply", waldo: "fred", plugh: "xyzzy"},
            "an undefined value": undefined,
            "a null value": null,
            "a string": "This should also fail",
            "a number": -1,
            "a NaN value": NaN
        };
        fluid.each(unacceptable, function(value, key){
            jqUnit.throws(function(){ that.pager.pageArray(value); }, "Paging through " + key + " should throw an error");
        });
    });
};

var recordData = require("../data/records.json");
fluid.defaults("gpii.ptd.api.tests.paging", {
    gradeNames: ["fluid.eventedComponent", "autoInit"],
    components: {
        pager: {
            type: "gpii.ptd.api.lib.paging"
        }
    },
    testArray: recordData.docs,
    listeners: {
        "onCreate.runTests": {
            funcName: "gpii.ptd.api.tests.paging.runTests",
            args:     ["{that}"]
        }
    }
});

gpii.ptd.api.tests.paging();
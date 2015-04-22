// Tests for the "filters" module.
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");
require("../../lib/filters");

var jqUnit = require("jqUnit");

jqUnit.module("Testing `filter` module");

jqUnit.test("Filtering with no options...", function () {
    var originalArray  = [{ foo: "bar"}, {baz: "qux"}];
    var backupArray    = fluid.copy(originalArray);
    var processedArray = gpii.ptd.api.lib.filter.filter(originalArray);

    jqUnit.assertDeepEq("The filtered data should be the same as the original...", originalArray, processedArray);
    jqUnit.assertDeepEq("The original data should not have been modified...", backupArray, originalArray);
});

jqUnit.test("Filtering with a single simple include option...", function () {
    var originalArray  = [{ foo: "bar"}, {baz: "qux"}];
    var backupArray    = fluid.copy(originalArray);
    var processedArray = gpii.ptd.api.lib.filter.filter(originalArray, { includes: { foo: "bar"} });

    jqUnit.assertDeepEq("The filtered data should only contain matching records...", [{ foo: "bar"}], processedArray);
    jqUnit.assertDeepEq("The original data should not have been modified...", backupArray, originalArray);
});

jqUnit.test("Filtering with a single simple exclude option...", function () {
    var originalArray  = [{ foo: "bar"}, {baz: "qux"}];
    var backupArray    = fluid.copy(originalArray);
    var processedArray = gpii.ptd.api.lib.filter.filter(originalArray, { excludes: { baz: "qux"} });

    jqUnit.assertDeepEq("The filtered data should only contain non-matching records...", [{ foo: "bar"}], processedArray);
    jqUnit.assertDeepEq("The original data should not have been modified...", backupArray, originalArray);
});

jqUnit.test("Filtering with multiple includes...", function () {
    var originalArray  = [{ foo: "bar"}, {baz: "qux"}];
    var backupArray    = fluid.copy(originalArray);
    var processedArray = gpii.ptd.api.lib.filter.filter(originalArray, { includes: { foo: "bar", baz: "qux"} });

    jqUnit.assertDeepEq("The filtered data should only contain matching records...", originalArray, processedArray);
    jqUnit.assertDeepEq("The original data should not have been modified...", backupArray, originalArray);
});

jqUnit.test("Filtering with multiple excludes...", function () {
    var originalArray  = [{ foo: "bar"}, {baz: "qux"}, { quux: "corge"}];
    var backupArray    = fluid.copy(originalArray);
    var processedArray = gpii.ptd.api.lib.filter.filter(originalArray, { excludes: { foo: "bar", baz: "qux"} });

    jqUnit.assertDeepEq("The filtered data should only contain non-matching records...", [{quux: "corge"}], processedArray);
    jqUnit.assertDeepEq("The original data should not have been modified...", backupArray, originalArray);
});

jqUnit.test("Filtering with both includes and excludes...", function () {
    var originalArray  = [{ foo: "bar"}, { foo: "bar", baz: "qux"}, { foo: "bar", quux: "corge"}];
    var backupArray    = fluid.copy(originalArray);
    var processedArray = gpii.ptd.api.lib.filter.filter(originalArray, { includes: { foo: "bar" }, excludes: { baz: "qux"} });

    jqUnit.assertDeepEq("The filtered data should only contain relevant records...", [{ foo: "bar"}, { foo: "bar", quux: "corge"}], processedArray);
    jqUnit.assertDeepEq("The original data should not have been modified...", backupArray, originalArray);
});

jqUnit.test("Filtering with conflicting includes and excludes...", function () {
    var originalArray  = [{ foo: "bar"}, { foo: "bar", baz: "qux"}, { foo: "bar", quux: "corge"}];
    var backupArray    = fluid.copy(originalArray);
    var processedArray = gpii.ptd.api.lib.filter.filter(originalArray, { includes: { foo: "bar" }, excludes: { foo: "bar"} });

    jqUnit.assertDeepEq("The filtered data should not contain any records...", [], processedArray);
    jqUnit.assertDeepEq("The original data should not have been modified...", backupArray, originalArray);
});

jqUnit.test("Filtering with expanded options and the 'less than' comparison...", function () {
    var originalArray  = [{ foo: 1 }, { foo: 2 }, { foo: 3 }];
    var backupArray    = fluid.copy(originalArray);
    var processedArray = gpii.ptd.api.lib.filter.filter(originalArray, { includes: { foo: { comparison: "lt", value: 3 } }, excludes: { foo: { comparison: "lt", value: 2 } } });

    jqUnit.assertDeepEq("The filtered data should only contain relevant records...", [ { foo: 2 }], processedArray);
    jqUnit.assertDeepEq("The original data should not have been modified...", backupArray, originalArray);
});

jqUnit.test("Filtering with expanded options and the 'less than or equal to' comparison...", function () {
    var originalArray  = [{ foo: 1 }, { foo: 2 }, { foo: 3 }];
    var backupArray    = fluid.copy(originalArray);
    var processedArray = gpii.ptd.api.lib.filter.filter(originalArray, { includes: { foo: { comparison: "le", value: 3 } }, excludes: { foo: { comparison: "le", value: 2 } } });

    jqUnit.assertDeepEq("The filtered data should only contain relevant records...", [ { foo: 3 } ], processedArray);
    jqUnit.assertDeepEq("The original data should not have been modified...", backupArray, originalArray);
});

jqUnit.test("Filtering with expanded options and the 'greater than' comparison...", function () {
    var originalArray  = [{ foo: 1 }, { foo: 2 }, { foo: 3 }];
    var backupArray    = fluid.copy(originalArray);
    var processedArray = gpii.ptd.api.lib.filter.filter(originalArray, { includes: { foo: { comparison: "gt", value: 1 } }, excludes: { foo: { comparison: "gt", value: 2 } } });

    jqUnit.assertDeepEq("The filtered data should only contain relevant records...", [ { foo: 2 }], processedArray);
    jqUnit.assertDeepEq("The original data should not have been modified...", backupArray, originalArray);
});

jqUnit.test("Filtering with expanded options and the 'great than or equal to' comparison...", function () {
    var originalArray  = [{ foo: 1 }, { foo: 2 }, { foo: 3 }];
    var backupArray    = fluid.copy(originalArray);
    var processedArray = gpii.ptd.api.lib.filter.filter(originalArray, { includes: { foo: { comparison: "ge", value: 1 } }, excludes: { foo: { comparison: "ge", value: 2 } } });

    jqUnit.assertDeepEq("The filtered data should only contain relevant records...", [ { foo: 1 } ], processedArray);
    jqUnit.assertDeepEq("The original data should not have been modified...", backupArray, originalArray);
});

jqUnit.test("Filtering with expanded options and the 'equal to' comparison...", function () {
    var originalArray  = [{ foo: 1, bar: 1 }, { foo: 1, bar: 2 }, { foo: 1, bar: 3 }];
    var backupArray    = fluid.copy(originalArray);
    var processedArray = gpii.ptd.api.lib.filter.filter(originalArray, { includes: { foo: { comparison: "eq", value: 1 } }, excludes: { bar: { comparison: "eq", value: 2 } } });

    jqUnit.assertDeepEq("The filtered data should only contain relevant records...", [ { foo: 1, bar: 1 }, { foo: 1, bar: 3 } ], processedArray);
    jqUnit.assertDeepEq("The original data should not have been modified...", backupArray, originalArray);
});

jqUnit.test("Filtering with expanded options and the default ('equal to') comparison...", function () {
    var originalArray  = [{ foo: 1, bar: 1 }, { foo: 1, bar: 2 }, { foo: 1, bar: 3 }];
    var backupArray    = fluid.copy(originalArray);
    var processedArray = gpii.ptd.api.lib.filter.filter(originalArray, { includes: { foo: { value: 1 } }, excludes: { bar: { value: 2 } } });

    jqUnit.assertDeepEq("The filtered data should only contain relevant records...", [ { foo: 1, bar: 1 }, { foo: 1, bar: 3 } ], processedArray);
    jqUnit.assertDeepEq("The original data should not have been modified...", backupArray, originalArray);
});


// These throw an error as expected but are somehow not caught by `jqUnit.throws`.  TODO:  Review with Antranig
//jqUnit.test("Filtering a non-array...", function () {
//    jqUnit["throws"](function () { gpii.ptd.api.lib.filter.filter({}); }, "Filtering a non-array should result in an error...");
//});
//
//jqUnit.test("Filtering with bad options...", function () {
//    jqUnit["throws"](function () { gpii.ptd.api.lib.filter.filter([], { includes: { foo: { comparison: "nonsense", value: 1 } }}); }, "Filtering with bad options should result in an error...");
//});

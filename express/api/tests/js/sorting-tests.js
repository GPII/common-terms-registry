"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.tests.sorting");

var jqUnit = require("jqUnit");

require("../../lib/sorting");

jqUnit.module("Testing `sort` functions...");

jqUnit.test("Test sorting with bad sort parameters...", function () {
    var dataToSort = [{ foo: "bar"}, { foo: "baz"} ];
    var backupData = fluid.copy(dataToSort);

    gpii.ptd.api.lib.sorting.sort(dataToSort);
    jqUnit.assertDeepEq("Sorting with no parameters should not have changed the data...", backupData, dataToSort);

    gpii.ptd.api.lib.sorting.sort(dataToSort, []);
    jqUnit.assertDeepEq("Sorting with an empty array should not have changed the data...", backupData, dataToSort);

    gpii.ptd.api.lib.sorting.sort(dataToSort, {});
    jqUnit.assertDeepEq("Sorting with a map should not have changed the data...", backupData, dataToSort);
});

jqUnit.test("Test sorting with bad data and good parameters...", function () {
    var params = [];

    // We are only confirming that none of these throw an error, there are no implicit assertions.
    jqUnit.expect(0);
    gpii.ptd.api.lib.sorting.sort(null,      params);
    gpii.ptd.api.lib.sorting.sort(undefined, params);
    gpii.ptd.api.lib.sorting.sort({},        params);
});

jqUnit.test("Test sorting with a single sort parameter...", function () {
    var dataToSort = [ {foo: "qux"}, { foo: "bar"}, { foo: "baz"} ];

    gpii.ptd.api.lib.sorting.sort(dataToSort, "/foo");

    jqUnit.assertDeepEq("The data should be sorted correctly...", [ { foo: "bar"}, { foo: "baz"}, {foo: "qux"} ], dataToSort);
});

jqUnit.test("Test sorting with a single sort parameter (without a leading forward slash)...", function () {
    var dataToSort = [ {foo: "qux"}, { foo: "bar"}, { foo: "baz"} ];

    gpii.ptd.api.lib.sorting.sort(dataToSort, "foo");

    jqUnit.assertDeepEq("The data should be sorted correctly...", [ { foo: "bar"}, { foo: "baz"}, {foo: "qux"} ], dataToSort);
});

jqUnit.test("Test descending sorting with a single sort parameter...", function () {
    var dataToSort = [ {foo: "qux"}, { foo: "bar"}, { foo: "baz"} ];

    gpii.ptd.api.lib.sorting.sort(dataToSort, "\\foo");

    jqUnit.assertDeepEq("The data should be sorted correctly...", [ {foo: "qux"}, { foo: "baz"}, { foo: "bar"} ], dataToSort);
});

jqUnit.test("Test descending sorting with a single sort parameter...", function () {
    var dataToSort = [ {foo: "qux"}, { foo: "bar"}, { foo: "baz"} ];

    gpii.ptd.api.lib.sorting.sort(dataToSort, "\\foo");

    jqUnit.assertDeepEq("The data should be sorted correctly...", [ {foo: "qux"}, { foo: "baz"}, { foo: "bar"} ], dataToSort);
});

jqUnit.test("Test sorting with data that does not have data matching the sort parameter...", function () {
    var dataToSort = [ {foo: "qux"}, { foo: "bar"}, { foo: "baz"} ];
    var backupData = fluid.copy(dataToSort);

    gpii.ptd.api.lib.sorting.sort(dataToSort, "notfound");
    jqUnit.assertDeepEq("Sorting with a sort parameter not contained in the data should not result in any changes...", backupData, dataToSort);
});

jqUnit.test("Test integer sorting...", function () {
    var baseData = [ {foo: 5.1}, { foo: 5.2}, { foo: 1} ];
    var expectedAscendingData = [ { foo: 1 }, {foo: 5.1}, { foo: 5.2} ];
    var expectedDescendingData = fluid.copy(expectedAscendingData).reverse();

    var types = ["float", "double", "long"];
    fluid.each(types, function (type) {
        var baseParam = "foo<" + type + ">";
        var descParam = "\\" + baseParam;

        var ascendingData = fluid.copy(baseData);
        gpii.ptd.api.lib.sorting.sort(ascendingData, baseParam);
        jqUnit.assertDeepEq("Data sorted by field type '" + type + "' should match the expected results...", expectedAscendingData, ascendingData);

        var descendingData = fluid.copy(baseData);
        gpii.ptd.api.lib.sorting.sort(descendingData, descParam);
        jqUnit.assertDeepEq("Data sorted by field type '" + type + "' (desc) should match the expected results...", expectedDescendingData, descendingData);
    });
});

jqUnit.test("Test date sorting...", function () {
    var noLaterDate = new Date();

    // Our function should be able to work with any value that new Date() would accept.
    //
    // In this case, `0` resolves to the earliest available data, i.e. the beginning of "the epoch", and we provide a
    // ISO 8601 string for a date between now and the epoch.  As in all cases, we expect the original data not be
    // altered by the sort "casting".
    var baseData = [ {foo: "1972-05-09"}, { foo: noLaterDate }, { foo: 0 } ];
    var expectedAscendingData = [ { foo: 0 }, {foo: "1972-05-09"}, { foo: noLaterDate } ];
    var expectedDescendingData = fluid.copy(expectedAscendingData).reverse();

    var baseParam = "foo<date>";
    var descParam = "\\" + baseParam;

    var ascendingData = fluid.copy(baseData);
    gpii.ptd.api.lib.sorting.sort(ascendingData, baseParam);
    jqUnit.assertDeepEq("Data sorted by field type 'date' should match the expected results...", expectedAscendingData, ascendingData);

    var descendingData = fluid.copy(baseData);
    gpii.ptd.api.lib.sorting.sort(descendingData, descParam);
    jqUnit.assertDeepEq("Data sorted by field type 'date' (desc) should match the expected results...", expectedDescendingData, descendingData);
});

jqUnit.test("Test complex sorting...", function () {
    var dataToSort = [ { a: 3, b: "a" }, { a: 5, b: "b" }, { a: 1, b: "a" }, { a: 7, b: "c" }, { a: 7, b: "a" } ];
    var expectedResults = [ { a: 7, b: "a" }, { a: 7, b: "c" }, { a: 5, b: "b" }, { a: 3, b: "a" }, { a: 1, b: "a" } ];

    gpii.ptd.api.lib.sorting.sort(dataToSort, ["\\a<int>", "b"]);

    jqUnit.assertDeepEq("The data should be sorted correctly...", dataToSort, expectedResults);
});
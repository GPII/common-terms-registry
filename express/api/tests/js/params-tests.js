// Tests for the standard query parameter parsing functions.
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("jqUnit");

require("../../lib/params");

jqUnit.module("Testing `params` functions...");

jqUnit.test("Test param parsing with malformed fieldConfiguration data...", function () {
    var simulatedReq = { foo: "bar", baz: "qux", quux: "corge" };

    jqUnit.assertDeepEq("Parsing params with an empty field definition should result in an empty hash...",     {}, gpii.ptd.api.lib.params.extractParams(simulatedReq, {}));
    jqUnit.assertDeepEq("Parsing params with a null field definition should result in an empty hash...",       {}, gpii.ptd.api.lib.params.extractParams(simulatedReq, null));
    jqUnit.assertDeepEq("Parsing params with an undefined field definition should result in an empty hash...", {}, gpii.ptd.api.lib.params.extractParams(simulatedReq, undefined));
});

jqUnit.test("Test param parsing using plain old string values...", function () {
    var simulatedReq    = { foo: "bar", baz: "qux", quux: "corge"};
    var mapFieldDefs    = { foo: {}, baz: {} };
    var undefinedDefs   = { foo: undefined, baz: null};

    var expectedOutput  = { foo: "bar", baz: "qux" };

    jqUnit.assertDeepEq("Parsing params whose fields use empty curly braces should work...", expectedOutput, gpii.ptd.api.lib.params.extractParams(simulatedReq, mapFieldDefs));
    jqUnit.assertDeepEq("Parsing params whose fields use undefined or null as their value should work...", expectedOutput, gpii.ptd.api.lib.params.extractParams(simulatedReq, undefinedDefs));
});

jqUnit.test("Test param parsing of non-string values when no hints are provided...", function () {
    var rightNow        = new Date();
    var simulatedReq    = { dateValue: rightNow, integerValue: 1, numberValue: 1.1, booleanValue: false, mapValue: { foo: "bar"} };
    var fieldDefs       = { dateValue: {}, integerValue: {}, numberValue: {}, booleanValue: {}, mapValue: {} };
    var expectedOutput  = { dateValue: rightNow, integerValue: 1, numberValue: 1.1, booleanValue: false, mapValue: { foo: "bar"} };

    jqUnit.assertDeepEq("Non-string data should be preserved...", expectedOutput, gpii.ptd.api.lib.params.extractParams(simulatedReq, fieldDefs));
});

jqUnit.test("Test param parsing of number values...", function () {
    var simulatedReq   = { foo: "1", bar: 1, baz: 2.2 };
    var fieldDefs      = { foo: { type: "number" }, bar: { type: "number"}, baz: { type: "number"} };
    var expectedOutput = { foo: 1, bar: 1, baz: 2.2 };

    jqUnit.assertDeepEq("Number data should be parsed as expected...", expectedOutput, gpii.ptd.api.lib.params.extractParams(simulatedReq, fieldDefs));
});

jqUnit.test("Test param parsing of date fields...", function () {
    var rightNow        = new Date();
    var simulatedReq   = { dateValue: rightNow, isoStringValue: rightNow.toISOString(), timestampValue: rightNow.getTime() };
    var fieldDefs      = { dateValue: { type: "date" }, isoStringValue: { type: "date"}, timestampValue: { type: "date"} };
    var expectedOutput = { dateValue: rightNow, isoStringValue: rightNow, timestampValue: rightNow };

    jqUnit.assertDeepEq("Date data should be parsed as expected...", expectedOutput, gpii.ptd.api.lib.params.extractParams(simulatedReq, fieldDefs));
});

jqUnit.test("Test param parsing of boolean fields...", function () {
    var simulatedReq   = { falseStringValue: "false", trueStringValue: "true", trueValue: true, falseValue: false, undefinedValue: undefined, nullValue: null };
    var fieldDefs      = { falseStringValue: { type: "boolean" }, trueStringValue: { type: "boolean" }, trueValue: { type: "boolean" }, falseValue: { type: "boolean" }, undefinedValue: { type: "boolean" }, nullValue: { type: "boolean" } };

    // Undefined and null values are assumed not to reflect a choice on the user's part, and are stripped from the results.
    var expectedOutput = { falseStringValue: false, trueStringValue: true, trueValue: true, falseValue: false };

    jqUnit.assertDeepEq("Boolean data should be parsed as expected...", expectedOutput, gpii.ptd.api.lib.params.extractParams(simulatedReq, fieldDefs));
});

jqUnit.test("Test lower casing of field data...", function () {
    var simulatedReq = {
        upperCaseString: "YO",
        mixedCaseString: "HoWdY",
        lowerCaseString: "already there",
        arrayValue: ["THIS", "SHOULD", "WORK"],
        booleanValue: true,
        undefinedValue: undefined,
        nullValue: null
    };

    var fieldDefs = {
        upperCaseString: { forceLowerCase: true },
        mixedCaseString: { forceLowerCase: true },
        lowerCaseString: { forceLowerCase: true },
        arrayValue:      { forceLowerCase: true },
        booleanValue:    { forceLowerCase: true },
        undefinedValue:  { forceLowerCase: true },
        nullValue:       { forceLowerCase: true }
    };

    // Undefined and null values are assumed not to reflect a choice on the user's part, and are stripped from the results.
    var expectedOutput = {
        upperCaseString: "yo",
        mixedCaseString: "howdy",
        lowerCaseString: "already there",
        arrayValue: ["this", "should", "work"],
        booleanValue: true
    };

    jqUnit.assertDeepEq("Data that is meant to be lower cased should be parsed as expected...", expectedOutput, gpii.ptd.api.lib.params.extractParams(simulatedReq, fieldDefs));
});

jqUnit.test("Test default value functionality...", function () {
    var rightNow = new Date();
    var simulatedReq = { noDefaults: "a real original", startedNull: null, startedUndefined: null };
    var fieldDefs    = {
        noDefaults:         {},
        dateValue:          { defaultValue: rightNow },
        stringValue:        { defaultValue: "this works" },
        arrayValue:         { defaultValue: [ 0, 1, "two" ] },
        numberValue:        { defaultValue: 3.1415 },
        startedNull:        { defaultValue: "ended up with something" },
        startedUndefined:   { defaultValue: "ended up with something" }
    };

    var expectedOutput  = {
        noDefaults:       "a real original",
        dateValue:        rightNow,
        stringValue:      "this works",
        arrayValue:       [ 0, 1, "two" ],
        numberValue:      3.1415,
        startedNull:      "ended up with something",
        startedUndefined: "ended up with something"
    };

    jqUnit.assertDeepEq("Defaults are expected to be set as expected...", expectedOutput, gpii.ptd.api.lib.params.extractParams(simulatedReq, fieldDefs));
});
/* Tests for the "express" and "router" module */
"use strict";
var fluid        = fluid || require("infusion");
var gpii         = fluid.registerNamespace("gpii");
var jqUnit       = require("jqUnit");

fluid.registerNamespace("gpii.ptd.api.tests.childrenTestCaseHolder");
require("../../lib/children");

fluid.setLogging(true);

// Wire in the two common "startup" sequences common to all tests.
gpii.ptd.api.tests.childrenTestCaseHolder.addRequiredSequences = function (sequenceStart, rawTests) {
    var completeTests = fluid.copy(rawTests);

    for (var a = 0; a < completeTests.length; a++) {
        var testSuite = completeTests[a];
        for (var b = 0; b < testSuite.tests.length; b++) {
            var tests = testSuite.tests[b];
            var modifiedSequence = sequenceStart.concat(tests.sequence);
            tests.sequence = modifiedSequence;
        }
    }

    return completeTests;
};

gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasChildren = function (that) {
    var processedRecords = that.model.processedRecords;
    jqUnit.assertNotUndefined("There should be processed data...", processedRecords);
    jqUnit.assertTrue("There should be at least one processed record...", processedRecords.length > 0);
    fluid.each(processedRecords, function (record) {
        jqUnit.assertNotUndefined("There should be 'aliases' data for each term...", record.aliases);
        jqUnit.assertTrue("There should be at least one alias record for each term...", record.aliases.length > 0);
    });
};

gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasNoChildren = function (that) {
    var processedRecords = that.model.processedRecords;
    jqUnit.assertNotUndefined("There should be processed data...", processedRecords);
    jqUnit.assertTrue("There should be at no processed records...", processedRecords.length === 0);

    fluid.each(processedRecords, function (record) {
        jqUnit.assertUndefined("There should be no 'aliases' data associated with non-term records...", record.aliases);
    });
};

// Wire in an instance of kettle.requests.request.http for each test and wire the check to its onError or onSuccess event
fluid.defaults("gpii.ptd.api.tests.childrenTestCaseHolder", {
    gradeNames: ["autoInit", "fluid.test.testCaseHolder"],
    testData: {
        "notReadyForChildren": [
            { type: "term" }, // No UID
            { type: "bogus", uid: "12345"}, // Wrong term type
            { type: "alias", uid: "org.gnome.system.proxy.http.host" } // Real record, still the wrong `type`.
        ],
        "readyForChildren": [
            { type: "term", uid: "brailleDevice"},
            { type: "term", uid: "host"}, // A deleted "term" record
            { type: "term", uid: "showAccels" },
            { type: "term", uid: "showWelcomeDialogAtStartup" },
            { type: "term", uid: "zoom"}
        ]
    },
    mergePolicy: {
        rawModules:    "noexpand",
        sequenceStart: "noexpand"
    },
    moduleSource: {
        funcName: "gpii.ptd.api.tests.childrenTestCaseHolder.addRequiredSequences",
        args:     ["{that}.options.sequenceStart", "{that}.options.rawModules"]
    },
    sequenceStart: [
        { // This sequence point is required because of a QUnit bug - it defers the start of sequence by 13ms "to avoid any current callbacks" in its words
            func: "{testEnvironment}.events.constructServer.fire"
        },
        {
            listener: "fluid.identity",
            event:    "{testEnvironment}.events.onStarted"
        }
    ],
    rawModules: [
        {
            tests: [
                // This must be tested first, or its event will be fired too soon for the tests to catch.
                {
                    name: "Testing a component 'born with children'...",
                    type: "test",
                    sequence: [
                        {
                            listener: "gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasChildren",
                            event:    "{bornWithChildren}.events.onChildrenLoaded",
                            args:     ["{bornWithChildren}"]
                        }
                    ]
                },
                {
                    name: "Testing adding children to term records...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "{readyForChildren}.applier.change",
                            args:     [ "originalRecords", "{testCaseHolder}.options.testData.readyForChildren" ]
                        },
                        {
                            listener: "gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasChildren",
                            event:    "{readyForChildren}.events.onChildrenLoaded",
                            args:     ["{readyForChildren}"]
                        }
                    ]
                },
                {
                    name: "Testing adding children to non-term records...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "{notreadyForChildren}.applier.change",
                            args:     [ "originalRecords", "{testCaseHolder}.options.testData.notReadyForChildren" ]
                        },
                        {
                            listener: "gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasNoChildren",
                            event:    "{notreadyForChildren}.events.onChildrenLoaded",
                            args:     ["{notreadyForChildren}"]
                        }
                    ]
                },
                {
                    name: "Testing misconfiguration (bad Couch URL)...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "{badDbUrl}.applier.change",
                            args:     [ "originalRecords", "{testCaseHolder}.options.testData.readyForChildren" ]
                        },
                        {
                            listener: "gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasNoChildren",
                            event:    "{badDbUrl}.events.onChildrenLoaded",
                            args:     ["{badDbUrl}"]
                        }
                    ]
                },
                {
                    name: "Testing misconfiguration (incorrect view path)...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "{badViewPath}.applier.change",
                            args:     [ "originalRecords", "{testCaseHolder}.options.testData.readyForChildren" ]
                        },
                        {
                            listener: "gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasNoChildren",
                            event:    "{badViewPath}.events.onChildrenLoaded",
                            args:     ["{badViewPath}"]
                        }
                    ]
                },
                {
                    name: "Testing misconfiguration (view path with a leading slash)...",
                    type: "test",
                    sequence: [
                        {
                            funcName: "{reallyBadViewPath}.applier.change",
                            args:     [ "originalRecords", "{testCaseHolder}.options.testData.readyForChildren" ]
                        },
                        {
                            listener: "gpii.ptd.api.tests.childrenTestCaseHolder.confirmHasNoChildren",
                            event:    "{reallyBadViewPath}.events.onChildrenLoaded",
                            args:     ["{reallyBadViewPath}"]
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        bornWithChildren: {
            type: "gpii.ptd.api.lib.children",
            options: {
                couchUrl:   "{testEnvironment}.options.couchUrl",
                viewPath:   "{testEnvironment}.options.viewPath",
                model: {
                    originalRecords: "{testCaseHolder}.options.testData.readyForChildren"
                }
            }
        },
        readyForChildren: {
            type: "gpii.ptd.api.lib.children",
            options: {
                couchUrl:   "{testEnvironment}.options.couchUrl",
                viewPath:   "{testEnvironment}.options.viewPath"
            }
        },
        notreadyForChildren: {
            type: "gpii.ptd.api.lib.children",
            options: {
                couchUrl:   "{testEnvironment}.options.couchUrl",
                viewPath:   "{testEnvironment}.options.viewPath"
            }
        },
        filteredOut: {
            type: "gpii.ptd.api.lib.children",
            options: {
                couchUrl:   "{testEnvironment}.options.couchUrl",
                viewPath:   "{testEnvironment}.options.viewPath"
            }
        },
        badDbUrl: {
            type: "gpii.ptd.api.lib.children",
            options: {
                couchUrl:   "http://localhost:5984/superbogus/",
                viewPath:   "{childrenTests}.options.viewPath"
            }
        },
        badViewPath: {
            type: "gpii.ptd.api.lib.children",
            options: {
                couchUrl:   "{childrenTests}.options.couchUrl",
                viewPath:   "_design/api/_view/changeling"
            }
        },
        reallyBadViewPath: {
            type: "gpii.ptd.api.lib.children",
            options: {
                couchUrl:   "{childrenTests}.options.couchUrl",
                viewPath:   "/_design/api/_view/changeling",  // The leading slash should not cause problems
                model: {
                    parentRecords: "{childrenTests}.options.testData.readyForChildren"
                }
            }
        }
    }
});

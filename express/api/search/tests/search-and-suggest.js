"use strict";

var fluid = require("infusion"),
    path = require("path"),
    configPath = path.resolve(__dirname, "../../../configs/gpii"),
    jqUnit = fluid.require("jqUnit"),
    gpii = fluid.registerNamespace("gpii"),
    kettle = fluid.require("kettle", require);

var searchTests = fluid.registerNamespace("gpii.ctr.tests.api.search");

// TODO:  Create my own setup broker that starts express, etc.
var referee = fluid.registerNamespace("gpii.ctr.tests.referee");
referee.init   = function() { console.log("init"); };
referee.finish = function() { console.log("finish"); };

// TODO:  Find out WTF they use in lieu of setup() up in this piece

// TODO: set up a pouchdb instance and load sample data

// TODO:  write a pouchdb view that emulates the output returned by lucene

// TODO: Spin up an express instance with the search and suggest modules configured and mounted

// TODO: Test searching for something that should return results

// TODO: Test searching for something that should not return results

// TODO: Test paging

// TODO: Test sorting

// TODO: Test omitting data for search

// TODO: Test sending invalid data to search

// TODO: Test omitting data for suggest

// TODO: Test sending paging information to suggest


searchTests.testSanity = function (data) {
    jqUnit.assertEquals("WTF",1,1);
};

var testDefs = [{
    name: "CTR API Search and Suggest Module Tests",
    expect: 1,
    config: {
        nodeEnv: "test",
        configPath: configPath
    },
    components: {
        referee: {
            type: "gpii.ctr.tests.referee",
            options: {
                port: 5972
            }
        },
        sanityRequest: {
            type: "kettle.tests.request.http",
            options: {
                requestOptions: {
                    path: "/search",
                    port: 4895
                },
                termMap: {
                }
            }
        }
    },
    sequence: [ { func: "{referee}.init"},
                { func: "{sanityRequest}.send" },
                {
                    event: "{sanityRequest}.events.onComplete",
                    listener: "gpii.ctr.tests.api.search.testSanity"
                },
                { func: "{referee}.finish" }
    ]
}];
module.exports = kettle.tests.bootstrap(testDefs);
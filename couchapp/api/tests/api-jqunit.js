"use strict";
var fluid = require("infusion");
var jqUnit = fluid.require("jqUnit");
var request = require('request');

var loader = require("../../../configs/lib/config-loader");
var config = loader.loadConfig(require("../../../configs/express/test.json"));

var testUtils = require("../../tests/lib/testUtils")(config);

// TODO:  Setup a new database  (how, given that it's async?)

// TODO:  Push the api code to the new database

jqUnit.module("Couch API Tests");

// TODO:  Test adding a valid record

// TODO:  Test adding invalid records

// TODO:  Test updating a valid record

// TODO:  Test updating a record with partial data

// TODO:  Test updating a record with invalid data

// TODO:  Test deleting a record (should be impossible)

jqUnit.onAllTestsDone.addListener(function() {
    // TODO:  Remove the database we just created
});
"use strict";

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
require("../../../node_modules/gpii-express/src/js/configholder");
require("../../lib/children");
require("../../lib/params");
require("../../../schema/lib/request");
require("../../../schema/lib/schema-helper");

var request = require("request");

fluid.registerNamespace("gpii.ptd.api.record.get.request");

gpii.ptd.api.record.get.request.checkRequirements = function (that) {
    if (!that.options.couchUrl) {
        fluid.fail("you must set a couchUrl option in order to use this component.");
    }
    if (!that.options.schemaName) {
        fluid.fail("You must configure a schema name to be used for responses.");
    }
    if (!that.options.querySchemaName) {
        fluid.fail("You must configure a schema name to be used to validate user input.");
    }

    gpii.ptd.api.record.get.request.handleRequest(that);
};

gpii.ptd.api.record.get.request.handleRequest = function (that) {
    try {
        // Make sure the user has sent us valid input
        gpii.ptd.api.record.get.request.extractParamsAndValidate(that);
    }
    catch (err) {
        that.sendSchemaAwareResponse(400, "message", { ok: false, message: err });
        return;
    }

    // TODO:  Encode the uniqueId to be used as a "key" parameter with the Couch view

    // We prepend a ./ to the second half of the URL to ensure that the database name is not stripped out.
    var couchRequestUrl = that.options.couchUrl + that.options.couchViewPath;

    var requestConfig = {
        url:     couchRequestUrl,
        qs:      { key: "\"" + that.params.uniqueId + "\"" },
        json:    true,
        timeout: 10000 // In practice, we probably only need a second, but the defaults are definitely too low.
    };

    request(requestConfig, that.processCouchResponse);
};


gpii.ptd.api.record.get.request.extractParamsAndValidate = function (that) {
    // Extract the parameters we will use throughout the process from the request.
    that.params = gpii.ptd.api.lib.params.extractParams(that.request.query, that.options.queryFields);

    that.params.uniqueId = that.request.params.uniqueId;

    // Start by validating using JSON Schema
    var errors = that.helper.validate(that.options.querySchemaName, that.params);
    if (errors) {
        throw (errors);
    }
};

gpii.ptd.api.record.get.request.processCouchResponse = function (that, error, _, body) {
    if (error) {
        var errorBody = {
            "ok": false,
            "message": error
        };

        that.sendSchemaAwareResponse("500", "message", errorBody);
        return;
    }

    if (body.rows  && body.rows.length > 0) {
        // Couch includes a `docs` field in its response, and each field hides its data in a `value` field.  This line flattens that out.
        var record = body.rows[0].value


        // Only lookup children if we are configured to work with them, and if we have "parent" records to start with.
        if (that.params.children && record.type === "term") {
            // Wait for the `children` component to get the child records and then process the results (see listener below).
            that.children.applier.change("originalRecords", [record]);
        }
        else {
            gpii.ptd.api.record.get.request.sendRecord(that, [record]);
        }
    }
    else {
        // We somehow did not receive records from couch.  Pass on whatever we did receive.
        that.sendSchemaAwareResponse("500", "message", { ok: false, message: body });
    }
};

// TODO: Confirm that a sensible error is returned when the ID is omitted.
//router.get("/", function (req, res) {
//    schemaHelper.setHeaders(res, "message");
//    return res.status(400).send({ok: false, message: "You must provide the required uniqueId in the path to use this interface."});
//});

gpii.ptd.api.record.get.request.sendRecord = function (that, records) {
    var responseBody = {
        "retrievedAt": new Date()
    };

    var record = Array.isArray(records) && records.length > 0 ? records[0] : null;

    // The status code should be 404 if no record was returned.
    var statusCode = record ? 200 : 404;
    responseBody.ok = record ? true : false;

    if (record) {
        responseBody.record = record;
    }
    else {
        responseBody.message = "No record was found for this uniqueId.";
    }

    that.sendSchemaAwareResponse(statusCode, that.options.schemaName, responseBody);
};

fluid.defaults("gpii.ptd.api.record.get.request", {
    gradeNames:     ["gpii.schema.requestAware", "autoInit"],
    schemaName:      "record",
    querySchemaName: "record-query",
    couchViewPath:   "/_design/api/_view/entries",
    components: {
        // The schema validation "helper".  If you want to use a different group of schemas, you'll need to configure the options for the helper.
        // We use the defaults supplied by the helper itself.
        "helper": {
            type: "gpii.schema.helper",
            options: {
                baseUrl:         "{request}.options.baseUrl"
            }
        },
        "pager": {
            type: "gpii.ptd.api.lib.paging"
        },
        "children": {
            type: "gpii.ptd.api.lib.children",
            options: {
                couchUrl: "{request}.options.couchUrl",
                listeners: {
                    "onChildrenLoaded": {
                        funcName: "gpii.ptd.api.record.get.request.sendRecord",
                        args: [ "{gpii.ptd.api.record.get.request}", "{children}.model.processedRecords" ]
                    }
                }
            }
        }
    },
    listeners: {
        "onCreate.checkRequirements": {
            funcName: "gpii.ptd.api.record.get.request.checkRequirements",
            args:     ["{that}"]
        }
    },
    invokers: {
        processCouchResponse: {
            funcName: "gpii.ptd.api.record.get.request.processCouchResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    }

});

fluid.registerNamespace("gpii.ptd.api.record.get");
fluid.defaults("gpii.ptd.api.record.get", {
    gradeNames:        ["gpii.express.requestAware.router", "autoInit"],
    path:              "/blah/:uniqueId",
    requestAwareGrade: "gpii.ptd.api.record.get.request",
    dynamicComponents: {
        requestHandler: {
            options: {
                querySchemaName: "{get}.options.querySchemaName",
                couchUrl:        "{get}.options.couchUrl",
                type:            "{get}.options.type",
                children:        "{get}.options.children",
                baseUrl:         "{get}.options.baseUrl"
            }
        }
    }
});

// Temporary shim to allow this module to respond as though it were a standalone express router
module.exports = function (config) {
    var get = gpii.ptd.api.record.get({
        type: (config && config.recordType) ? config.recordType : "record",
        children: (config && config.recordType === "term") ? true : false,
        modules: {
            expressConfigHolder: {
                type: ["gpii.express.expressConfigHolder"],
                options: {
                    config: config
                }
            }
        },
        // TODO:  Why can't we pick these up from the config holder?  Review with Antranig.
        couchUrl: config["couch.url"],
        baseUrl:  config["base.url"]
    });

    return get.getRouter();
};
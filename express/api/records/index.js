"use strict";

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.records");

// Bring in our helper components
require("gpii-express");
require("../../schema/lib/schema-helper");
require("../lib/sorting");
require("../lib/filters");
require("../lib/paging");
require("../lib/children");
require("../lib/params");

var request  = require("request");

gpii.ptd.records.checkRequirements = function (that) {
    if (!that.options.couchUrl) {
        fluid.fail("you must set a couchUrl option in order to use this component.");
    }
    if (!that.options.type) {
        fluid.fail("You must set a type in your options in order to use this component.");
    }
    if (!that.options.viewPath) {
        fluid.fail("You must set a viewPath in your options in order to use this component.");
    }
    if (that.options.viewPath[that.options.type] === -1) {
        fluid.fail("You must register a couch view for a new record type.  Can't continue.");
    }
    if (!that.options.path) {
        fluid.fail("You must configure the path within Express that this component will handle.");
    }
    if (!that.options.querySchemaName) {
        fluid.fail("You must configure a schema name to be used for input validation.");
    }
};

// Use the standard `params` functions to convert `req.params` into data that can be validated, and that includes any
// default values not overridden by the query data.
gpii.ptd.records.extractParams = function (that, req) {
    // Use the standard `params` function to do most of the heavy lifting.
    that.params = gpii.ptd.api.lib.params.extractParams(req.query, that.options.queryFields);

    // If we are asked to provide "children", we have to override whatever record types we were passed and make sure we are dealing with "term" records.
    if (that.options.children || that.params.children) {
        that.params.type = "term";
    }
};

// Validate the parameters extracted previously.
gpii.ptd.records.validateInput = function (that) {
    var errors = that.helper.validate(that.options.querySchemaName, that.params);
    if (errors) {
        throw (errors);
    }
};

//  The default router that works for everything but "terms".  Hit the right view and send back the results.
gpii.ptd.records.getRouter = function (that) {
    return function (req, res) {
        // Save the response session variable so that we can contact the user once we receive our results.
        that.res = res;

        try {
            // Extract the parameters we will use throughout the process from the request.
            gpii.ptd.records.extractParams(that, req);

            // Make sure the user has sent us valid input
            gpii.ptd.records.validateInput(that);
        }
        catch (err) {
            that.sendResponse(400, "message", err);
            return;
        }

        // We prepend a ./ to the second half of the URL to ensure that the database name is not stripped out.
        var couchRequestUrl = that.options.couchUrl + that.options.viewPath[that.options.type];
        var requestConfig = {
            url:     couchRequestUrl,
            data:    that.params,
            json:    true,
            timeout: 10000 // In practice, we probably only need a second, but the defaults are definitely too low.
        };

        request(requestConfig, that.processCouchResponse);
    };
};

// Convert the couch data to our local format and continue processing, either by looking up children, or by sending the
// results to the end user.
gpii.ptd.records.processCouchResponse = function (that, error, _, body) {
    if (error) {
        var errorBody = {
            "ok": false,
            "message": error
        };

        that.sendResponse("500", "message", errorBody);
        return;
    }

    if (body.rows) {
        // Couch includes a `docs` field in its response, and each field hides its data in a `value` field.  This line flattens that out.
        var records = body.rows.map(function (doc) {
            return doc.value;
        });

        // TODO: Filter the results by the current record type and any other relevant implied settings
        // TODO: We need to supply parameters in the new format, for now they will be ignored.
        var filterParams = gpii.ptd.records.getFilterParams(that);
        var filteredRecords = gpii.ptd.api.lib.filter.filter(records, filterParams);

        // Sort the results
        var sortedRecords = that.params.sort ? gpii.ptd.api.lib.sorting.sort(filteredRecords, that.params.sort) : filteredRecords;

        // Page the results
        var pagedRecords = that.pager.pageArray(sortedRecords, that.params);

        if (that.options.children || that.params.children) {
            // Wait for the `children` component to get the child records and then process the results (see listener below).
            that.children.applier.change("originalRecords", pagedRecords);
        }
        else {
            gpii.ptd.records.sendRecords(that, pagedRecords);
        }
    }
    else {
        // We somehow did not receive records from couch.  Pass on whatever we did receive.
        that.sendResponse("500", "message", { ok: false, message: body });
    }
};

// Convert from our "query" model to the format used by the `filter` functions.
gpii.ptd.records.getFilterParams = function (that) {
    var filterParams = {};
    var filterFields = gpii.ptd.records.getFilterFields(that);

    var includes = {};
    fluid.each(that.params, function (value, field) {
        var fieldDefinition = filterFields[field];
        if (fieldDefinition) {
            if (fieldDefinition.comparison || fieldDefinition.type) {
                var fieldIncludes = {
                    value:      value
                };
                if (fieldDefinition.comparison) {
                    fieldIncludes.comparison = fieldDefinition.comparison;
                }
                if (fieldDefinition.type) {
                    fieldIncludes.type = fieldDefinition.type;
                }
                includes[field] = fieldIncludes;
            }
            else {
                includes[field] = value;
            }
        }
    });

    // Only add "includes" if we actually have data
    if (Object.keys(includes).length > 0) {
        filterParams.includes = includes;
    }

    return filterParams;
};

// Convenience function to get the list of filter fields.  The `filterField` option in a field definition entry will
// cause it to be included in the results.
gpii.ptd.records.getFilterFields = function (that) {
    return gpii.ptd.api.lib.params.getRelevantFields(that.options.queryFields, "filterField");
};

// Convenience function to get the list of filter fields.  The `pagingField` option in a field definition entry will
// cause it to be included in the results.
gpii.ptd.records.getPagingFields = function (that) {
    return gpii.ptd.api.lib.params.getRelevantFields(that.options.queryFields, "pagingField");
};

// Convenience function to get the list of filter fields.  The `sortingField` option in a field definition entry will
// cause it to be included in the results.
gpii.ptd.records.getSortingFields = function (that) {
    return gpii.ptd.api.lib.params.getRelevantFields(that.options.queryFields, "sortingField");
};

gpii.ptd.records.sendRecords = function (that, records) {
    var responseBody = {
        "ok":          true,
        "total_rows" : 0,
        "records":     records,
        "offset":      that.params.offset,
        "limit":       that.params.limit,
        "params":      that.params,
        "retrievedAt": new Date()
    };

    that.sendResponse(200, "message", responseBody);
};

// Consolidated function to send a response to the user.  Replaces previous approaches that accessed the `response` object directly.
gpii.ptd.records.sendResponse = function (that, status, key, responseBody) {
    if (!status) {
        fluid.fail("You must send the user a status code.");
    }
    if (!key) {
        fluid.fail("You must provide a key that can be used to set the response headers.");
    }
    if (!responseBody) {
        fluid.fail("You must send the user a response body.");
    }

    var headers = that.helper.getSchemaHeaders(key);
    that.res.status(status);
    fluid.each(headers, function (value, key) {
        that.res.header(key, value);
    });
    that.res.send(responseBody);
};

fluid.defaults("gpii.ptd.records", {
    gradeNames:      ["gpii.express.router", "autoInit"],
    querySchemaName: "records-query",
    couchUrl:        "",
    path:            "/records",
    type:      "record",
    children:        false,
    // TODO:  Why can't this be resolved with either the short or long form?  Review with Antranig.
    //config:          "{gpii.express.expressConfigHolder}.options.config", // gpii.express will provide this.  If you are using this module elsewhere, you will need to provide it.
    components: {
        // The schema validation "helper".  If you want to use a different group of schemas, you'll need to configure the options for the helper.
        // We use the defaults supplied by the helper itself.
        "helper": {
            type: "gpii.schema.helper",
            options: {
                // TODO:  This does not exist when we are created, and as such is never set.  Review with Antranig.
                //baseUrl: "{that}.options.config['base.url']"
                baseUrl: "http://localhost:4680"
            }
        },
        "pager": {
            type: "gpii.ptd.api.lib.paging"
        },
        "children": {
            type: "gpii.ptd.api.lib.children",
            options: {
                couchUrl: "{that}.options.couchUrl",
                listeners: {
                    "onChildrenLoaded": {
                        funcName: "gpii.ptd.records.sendRecords",
                        args: [ "{records}", "{children}.model.processedRecords" ]
                    }
                }
            }
        }
    },
    members: {
        res:    null,
        params: {}
    },
    // The list of query fields we support, with hints about their defaults (if any) and their default value (if any)
    //
    // All actual query input validation is handled using a JSON schema.
    queryFields: {
        "sort": {},
        "offset": {
            type:         "number",
            pagingField:  true,
            defaultValue: 0
        },
        "limit": {
            type:         "number",
            pagingField:  true,
            defaultValue: 25
        },
        "status": {
            filterField:  true,
            forceLower:   true,
            defaultValue: ["unreviewed", "draft", "candidate", "active"]
        },
        "children": {
            type: "boolean"
        },
        "updated": {
            type:        "date",
            comparison:  "ge",  // We want records whose date is equal to or newer than the `updated` field
            filterField: true
        },
        "type": {
            filterField: true,
            forceLower:  true
        }
    },
    viewPath: {
        alias:       "/_design/api/_view/aliases",
        condition:   "/_design/api/_view/conditions",
        record:      "/_design/api/_view/entries",
        term:        "/_design/api/_view/terms",
        transform:   "/_design/api/_view/transforms",
        translation: "/_design/api/_view/translations"
    },
    listeners: {
        "onCreate.checkRequirements": {
            funcName: "gpii.ptd.records.checkRequirements",
            args:     ["{that}"]
        }
    },
    invokers: {
        filterAndSort: {
            funcName: "gpii.ptd.records.filterAndSort",
            args:     ["{that}", "{arguments}.0"]
        },
        getRouter: {
            funcName: "gpii.ptd.records.getRouter",
            args:     ["{that}"]
        },
        processCouchResponse: {
            funcName: "gpii.ptd.records.processCouchResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        sendResponse: {
            funcName: "gpii.ptd.records.sendResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    }
});

// A transitional "shim" to allow the previous CommonJS style of requiring this module.
// We return our "router" function, which the next level up will wire in using its own logic.
// TODO:  Remove this once the next level up ("api") has been refactored to use only Fluid components.
module.exports = function (config) {
    // We need to explicitly override the configuration that is ordinarily distributed by `gpii.express`.
    // TODO:  Make sure we fall back to the default behavior correctly once we are using `gpii.express` upstream.
    var records = gpii.ptd.records({
        modules: {
            expressConfigHolder: {
                type: ["gpii.express.expressConfigHolder"],
                options: {
                    config: config
                }
            }
        },
        couchUrl: config["couch.url"]
    });
    return records.getRouter();
};


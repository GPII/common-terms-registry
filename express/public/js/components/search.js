// The main search module that allows users to view the Preference Terms Dictionary

(function ($, fluid) {
    "use strict";
    var search = fluid.registerNamespace("ctr.components.search");
    var templates = fluid.registerNamespace("ctr.components.templates");

    // TODO:  Create session-scoped variables for query, status, record type, and language, and use if no data is provided.

    search.clear = function(that) {
        var queryInput = that.locate("input");
        queryInput.val(null);
        search.refresh(that);
    };

    search.handleKeys = function(that, event) {
        if (event.which === 13) {
            search.refresh(that);
        }
    };

    // Update the results displayed whenever we have new search data
    search.refresh = function(that) {
        // The query values are all stored in the form's DOM.
        // TODO: Review this with Antranig or Justin

        var settings = {
            success: displayResults,
            error:   displayError
        };

        // Wire in sorting and filtering to both types of requests
        var queryInput = that.locate("input");
        if (queryInput && queryInput.val()) {
            settings.url = "/api/search";
            settings.data = { q: queryInput.val()};
        }
        else {
            settings.url = "/api/records?children=true";
        }

        // Wire in support for clearing the search easily
        var clearButton = that.locate("clear");
        if (queryInput.val()) {
            clearButton.show();
        }
        else {
            clearButton.hide();
        }

        // TODO:  How do we pick up our base URL from the configuration?

        // TODO:  Wire in support for status controls

        // TODO:  Wire in support for record type controls

        $.ajax(settings);
    };

    // TODO:  Ask AMB how to access {that} from jQuery-ized handlers like this.
    function displayError(jqXHR, textStatus, errorThrown) {
        prependTemplate("#main-viewport","error",{message: errorThrown});
    }

    // TODO:  Ask AMB how to access {that} from jQuery-ized handlers like this.
    function displayResults(data, textStatus, jqXHR) {
        $("#main-viewport").html("");
        if (data && data.records && data.records.length > 0) {
            // TODO:  Come up with a meaningful list of untranslated records
            var localEnd = data.offset + data.limit;
            var navData = {
                count: data.total_rows,
                start: data.offset + 1,
                end: data.total_rows < localEnd ? data.total_rows : localEnd,
                untranslated: 0
            };

            // prepend the control title bar
            templates.appendTo("#main-viewport","navigation", navData);

            // display each record in the results area
            data.records.forEach(function(record) {
                templates.appendTo("#main-viewport","record",record);
            });
        }
        else {
            templates.replaceWith("#main-viewport","norecord");
        }

        // TODO: add support for pagination or infinite scrolling
    }

    // TODO:  Extract the template handling functions to a separate utility library


    fluid.defaults("ctr.components.search", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        selectors: {
            "input":   ".ptd-search-input",
            "go":      ".ptd-search-button",
            "clear":   ".ptd-clear-button",
            "results": ".ptd-search-results"
        },
        events: {
            "refresh":  "preventable",
            "clear":    "preventable"
        },
        invokers: {
            "refresh": {
                funcName: "ctr.components.search.refresh",
                args: [ "{that}"]
            },
            "clear": {
                funcName: "ctr.components.search.clear",
                args: [ "{that}"]
            },
            "handleKeys": {
                funcName: "ctr.components.search.handleKeys",
                args: [ "{that}", "{arguments}.0"]
            }
        },
        listeners: {
            onCreate: [
                {
                    "this": "{that}.dom.go",
                    method: "click",
                    args: "{that}.refresh"
                },
                {
                    "this": "{that}.dom.clear",
                    method: "click",
                    args: "{that}.clear"
                },
                {
                    "this": "{that}.dom.input",
                    method: "keyup",
                    args: "{that}.handleKeys"
                }
            ],
            "refresh": {
                func: "ctr.components.search.refresh",
                args: [ "{that}"]
            }
        }
    });
})(jQuery, fluid_1_5);
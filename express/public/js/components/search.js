// The main search module that allows users to view the Preference Terms Dictionary

(function ($) {
    "use strict";
    var search    = fluid.registerNamespace("ctr.components.search");
    var templates = fluid.registerNamespace("ctr.components.templates");

    // TODO:  Create session-scoped variables for query, status, record type, and language, and use if no data is provided.

    // TODO: How do we correctly instantiate a bunch of record objects with their own controls, which contain aliases with their own controls?

    search.clear = function(that) {
        var queryInput = that.locate("input");
        queryInput.val(null);
        search.queryChanged(that,null);
    };

    search.showClearButton = function (that, show) {
        // Wire in support for clearing the search easily
        var clearButton = that.locate("clear");
        if (show) {
            clearButton.attr("tabIndex",0);
            clearButton.show();
        }
        else {
            clearButton.attr("tabIndex",-1);
            clearButton.hide();
        }
    };

    // This function is meant to be called on an individual alias entry toggle
    search.toggleAliasRecord = function () {
        $(this).html($(this).html() === "less" ? "more": "less");
        $(this).parent().parent().parent().find(".alias-details").toggle();
    };

    // Update the results displayed whenever we have new search data
    search.queryChanged = function(that, queryInput) {
        var emptyQuery = (!queryInput || queryInput === "");
        if (that.showClearButton) {
            that.showClearButton(!emptyQuery);
        }

        // TODO: Figure out why the hell this is happening...
        if (!that.displayResults) {
            console.log("queryChanged was called before invokers were in place.  Bailing out...");
            return;
        }

        var settings = {
            url:     that.options.baseUrl,
            success: that.displayResults,
            error:   that.displayError
        };

        // Wire in sorting and filtering to both types of requests
        // TODO: Break out this AJAX assembly and launch function into its own function
        var baseUrl = that.options.baseUrl;
        if (emptyQuery) {
            settings.url += "/records?children=true";
        }
        else {
            settings.url += "/search";
            settings.data = { q: queryInput};
        }

        // TODO:  Wire in support for status controls

        // TODO:  Wire in support for record type controls

        $.ajax(settings);
    };

    search.displayError = function(that, jqXHR, textStatus, errorThrown) {
        templates.prependTo(that.locate("viewport"),"error",{message: errorThrown});
    };

    search.displayResults = function(that, data, textStatus, jqXHR) {
        var viewport = that.locate("viewport");
        if (data && data.records && data.records.length > 0) {
            viewport.html("");

            // TODO:  Come up with a meaningful list of untranslated records
            var localEnd = data.offset + data.limit;
            var navData = {
                count: data.total_rows,
                start: data.offset + 1,
                end: data.total_rows < localEnd ? data.total_rows : localEnd,
                untranslated: 0
            };

            // prepend the control title bar
            templates.appendTo(viewport, "navigation", navData);

            // display each record in the results area
            data.records.forEach(function(record) {
                templates.appendTo(viewport, "record", { record: record, user: that.data.model.user });
            });
        }
        else {
            templates.replaceWith(viewport, "norecord");
        }

        // Wire up the alias show/hide controls
        $(viewport).find(".alias-toggle").bind('click',search.toggleAliasRecord);

        // TODO: add support for pagination or infinite scrolling
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    search.init = function(that) {
        templates.loadTemplates(function() { search.queryChanged(that); });
    };

    ctr.components.applyBinding = function (that) {
        var bindings = that.options.bindings;
        fluid.each(bindings, function (binding) {
            var element = that.locate(binding.selector);
            // in time, break out different ways of accessing the DOM into dedicated functions,
            // index by the "elementType" field we will add to "bindings"
            element.change(function () {
                var value = element.val();
                that.applier.change(binding.path, value);
            });
            that.applier.modelChanged.addListener(binding.path, function (change) {
                element.val(change);
            });
        });
    };

    fluid.defaults("ctr.components.search", {
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        baseUrl: "/api",
        selectors: {
            "input":    ".ptd-search-input",
            "go":       ".ptd-search-button",
            "clear":    ".ptd-clear-button",
            "viewport": ".ptd-viewport"
        },
        bindings: [{
            selector:    "input",
            path:        "input",
            elementType: "encode different ways of accessing values here"
        }],
        components: {
            data:    {
                type: "ctr.components.data"
            },
            controls:    {
                type: "ctr.components.userControls",
                container: ".user-container",
                options: {
                    components: {
                        data: "{ctr.components.search}.data"
                    },
                    listeners: {
                        afterLogout:
                        {
                            func: "{ctr.components.search}.events.refresh.fire"
                        }
                    }
                }
            }
        },
        events: {
            "refresh":   "preventable",
            "clear":     "preventable"
        },
        invokers: {
            "clear": {
                funcName: "ctr.components.search.clear",
                args: [ "{that}"]
            },
            "init": {
                funcName: "ctr.components.search.init",
                args: ["{that}"]
            },
            "displayError": {
                funcName: "ctr.components.search.displayError",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "displayResults": {
                funcName: "ctr.components.search.displayResults",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "showClearButton": {
                funcName: "ctr.components.search.showClearButton",
                args: ["{that}", "{arguments}.0"]
            }
        },
        modelListeners: {
            "input": {
                funcName: "ctr.components.search.queryChanged",
                excludeSource: "init",
                args: ["{that}", "{change}.value"]
            }
        },
        listeners: {
            onCreate: [
                {
                    "this": "{that}.dom.clear",
                    method: "click",
                    args:   "{that}.clear"
                },
                {
                    "this": "{that}.dom.clear",
                    method: "keypress",
                    args:   "{that}.clear"
                },
                {
                    "funcName": "ctr.components.applyBinding",
                    "args":     "{that}"
                },
                {
                    "funcName": "ctr.components.search.init",
                    "args":     "{that}"
                }
            ],
            "refresh": {
                func: "ctr.components.search.queryChanged",
                args: [ "{that}"]
            }
        }
    });
})(jQuery);
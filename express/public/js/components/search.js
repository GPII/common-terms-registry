// The main search module that allows users to view the Preference Terms Dictionary

(function ($) {
    "use strict";
    var search    = fluid.registerNamespace("ctr.components.search");
    var templates = fluid.registerNamespace("ctr.components.templates");

    // TODO:  Create session-scoped variables for query, status, record type, and language, and use if no data is provided.

    search.clearSearchFilter = function(that) {
        that.applier.change("searchSettings.query", undefined);
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
    search.searchSettingsChanged = function(that) {
        var emptyQuery = !Boolean(that.model.searchSettings.query);
        if (that.showClearButton) {
            that.showClearButton(!emptyQuery);
        }

        // TODO:  Hide the option to sort by best match if there is no query data, show it if there is.
        // TODO:  Set the sort to "best match" when search query data is entered.
        // TODO:  Allow users to override the sort option once search query data is entered (look for what has changed)


        // TODO: Figure out why the hell this is happening...
        if (!that.displayResults) {
            console.log("searchSettingsChanged was called before invokers were in place.  Bailing out...");
            return;
        }

        // TODO: add controls for pagination or infinite scrolling.  For now, searches will return and display all results.

        var settings = {
            url:     that.options.baseUrl,
            success: that.displayResults,
            error:   that.displayError,
            data:    {
                limit:  that.model.searchSettings.limit,
                sort:   that.model.searchSettings.sort,
                status: that.model.searchSettings.statuses
            }
        };

        if (!emptyQuery) {
            settings.data.q = that.model.searchSettings.query;
        }

        // TODO: Break out this AJAX assembly and launch function into its own function
        var baseUrl = that.options.baseUrl;
        if (emptyQuery) {
            settings.url += "/terms";
            settings.data.children=true;
        }
        else {
            settings.url += "/search";
        }

        // TODO:  Wire in support for term/condition controls

        $.ajax(settings);
    };

    search.displayError = function(that, jqXHR, textStatus, errorThrown) {
        templates.prependTo(that.locate("viewport"),"error",{message: errorThrown});
        that.events.markupLoaded.fire();
    };

    search.displayResults = function(that, data, textStatus, jqXHR) {
        var viewport = that.locate("viewport");
        if (data && data.records && data.records.length > 0) {
            viewport.html("");

            // TODO:  Come up with a meaningful list of untranslated records

            // TODO:  Expose pagination information once we have it
            var localEnd = data.offset + data.limit;
            var navData = {
                count:        data.total_rows,
                start:        data.offset + 1,
                end:          data.total_rows < localEnd ? data.total_rows : localEnd,
                untranslated: 0
            };

            // prepend the control title bar
            templates.appendTo(viewport, "search-navigation", navData);

            // display each record in the results area
            data.records.forEach(function(record) {
                templates.appendTo(viewport, "search-record", { record: record, user: that.model.user });
            });
        }
        else {
            templates.replaceWith(viewport, "norecord");
        }

        that.events.markupLoaded.fire();
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    search.init = function(that) {
        templates.loadTemplates(function() { search.searchSettingsChanged(that); });
    };

    fluid.defaults("ctr.components.search", {
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        baseUrl: "/api",
        selectors: {
            "query":    ".ptd-search-query",
            "sort":     ".ptd-search-sort",
            "status":   ".ptd-search-status",
            "go":       ".ptd-search-button",
            "clear":    ".ptd-clear-button",
            "viewport": ".ptd-viewport"
        },
        bindings: [
            {
                selector:    "query",
                path:        "searchSettings.query",
                elementType: "text"
            },
            {
                selector:    "sort",
                path:        "searchSettings.sort",
                elementType: "select"
            },
            {
                selector:    "status",
                path:        "searchSettings.statuses",
                elementType: "select"
            }
        ],
        components: {
            data:    {
                type: "ctr.components.data",
                options: {
                    model: {
                        searchSettings: {
                            limit:    -1,
                            sort:     "uniqueId",
                            statuses: ["active","unreviewed","candidate","draft"],
                            query:    ""
                        }
                    }
                }
            },
            userControls:    {
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
        model: "{data}.model",
        events: {
            "refresh":           "preventable",
            "clearSearchFilter": "preventable",
            "markupLoaded":      "preventable"
        },
        invokers: {
            "toggleAliasRecord": {
                funcName: "ctr.components.search.toggleAliasRecord",
                args: [ "{that}"]
            },
            "clearSearchFilter": {
                funcName: "ctr.components.search.clearSearchFilter",
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
            "searchSettings.*": [
                {
                    funcName: "ctr.components.search.searchSettingsChanged",
                    excludeSource: "init",
                    args: ["{that}"]
                }
            ]
        },
        listeners: {
            onCreate: [
                {
                    "funcName": "ctr.components.search.init",
                    "args":     "{that}"
                }
            ],
            markupLoaded: [
                {
                    "this": "{that}.dom.clear",
                    method: "click",
                    args:   "{that}.clearSearchFilter"
                },
                {
                    "this": "{that}.dom.clear",
                    method: "keypress",
                    args:   "{that}.clearSearchFilter"
                },
                {
                    "this": "{that}.dom.aliasToggle",
                    method: "click",
                    args:   "{that}.toggleAliasRecord"
                },
                {
                    "this": "{that}.dom.aliasToggle",
                    method: "keypress",
                    args:   "{that}.toggleAliasRecord"
                },
                {
                    "funcName": "ctr.components.binder.applyBinding",
                    "args":     "{that}"
                }
            ],
            "refresh": {
                func: "ctr.components.search.searchSettingsChanged",
                args: [ "{that}"]
            }
        }
    });
})(jQuery);
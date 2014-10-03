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

    // Change the search offset and trigger a refresh when a page navigation link is clicked
    search.changePage = function(that,event) {
        var element = $(event.currentTarget);
        var offset = parseInt(element.attr('offset'));

        // If we click on a link that has the same offset as the current value, no change functions are fired.
        that.applier.change("searchSettings.offset", offset);
    };

    // Generate navigation links when the page is refreshed, as the number of pages may have changed
    search.updatePagination = function(that) {
        var container = that.locate("pageLinks");
        container.html("");

        var pages = 1;
        // If the limits are off, we have one page of results, guaranteed
        if (that.model.searchSettings.limit !== -1) {
            if (that.model.count && that.model.count > 0) {
                pages = Math.ceil(that.model.count/that.model.searchSettings.limit);
            }
        }

        var currentPage = 1;
        if (that.model.limit !== -1) {
            currentPage = Math.floor(that.model.searchSettings.offset/that.model.searchSettings.limit) + 1;
        }

        var navStart    = that.locate("navStart");
        var navPrevious = that.locate("navPrevious");
        var navNext     = that.locate("navNext");
        var navEnd      = that.locate("navEnd");

        if (pages === 1) {
            templates.prepend(container,"search-navigation-page-current-link",{offset: 0, page: 1});
        }
        else {

            if (currentPage > 1 ) {
                navPrevious.attr('offset', (currentPage - 2) * that.model.searchSettings.limit);
            }

            if (pages > 1 && currentPage < pages) {
                navNext.attr('offset', currentPage * that.model.searchSettings.limit);
                navEnd.attr('offset', (pages-1) * that.model.searchSettings.limit);
            }

            for (var a = pages - 1; a >= 0; a--) {
                var page = a+1;
                var pageOffset = a * that.model.searchSettings.limit;

                if (page === currentPage) {
                    templates.prepend(container,"search-navigation-page-current-link",{offset: pageOffset, page: page});
                }
                else {
                    templates.prepend(container,"search-navigation-page-link",{offset: pageOffset, page: page});
                }
            }
        }

        templates.prepend(container,"search-navigation-previous-page-links");
        templates.append(container,"search-navigation-next-page-links");

        // Fire a "nav loaded" event so that we can wire up the appropriate listeners
        that.events.navBarLoaded.fire();
    };

    // We have to reset the offset if someone changes the search terms.  Otherwise we could be on a page that's larger than the result set.
    search.clearOffset = function(that)  {
        that.applier.change("searchSettings.offset",0);
    };

    // This function is meant to be called on an individual alias entry toggle
    search.toggleAliasRecord = function (that, event) {
        var element = $(event.currentTarget);
        element.html(element.html() === "less" ? "more": "less");
        element.parent().parent().parent().find(".alias-details").toggle();
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
                offset: that.model.searchSettings.offset,
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

    search.updateStatusControls = function(that) {
//        var statusString = "...";
//        if (!that.model.searchSettings.statuses) {
//            statusString = "No Status Selected";
//        }
//        else if (that.model.searchSettings.statuses.length === 1) {
//            // TODO:  Title Case the strings used here, or at least the first one.
//            statusString = that.model.searchSettings.statuses[0]+ " Records";
//        }
//        else {
//            statusString = that.model.searchSettings.statuses.join(", ") + " Records";
//        }
//
//        that.locate("statusText").html(statusString);
    };

    search.toggleStatusControls = function(that) {
        that.locate("statusSelect").toggle();
    };

    search.displayError = function(that, jqXHR, textStatus, errorThrown) {
        var message = errorThrown;
        try {
            var jsonData = JSON.parse(jqXHR.responseText);
            if (jsonData.message) { message = jsonData.message; }
        }
        catch (e) {
            console.log("jQuery.ajax call returned meaningless jqXHR.responseText payload. Using 'errorThrown' instead.");
        }
        templates.prepend(that.locate("viewport"),"common-error", message);
        that.events.markupLoaded.fire();
    };

    search.displayResults = function(that, data, textStatus, jqXHR) {
        var viewport = that.locate("viewport");
        if (data && data.records && data.records.length > 0) {
            viewport.html("");

            // TODO:  Come up with a meaningful list of untranslated records

            that.applier.change("count", data.total_rows);

            // Add the search navigation to the header
            templates.replaceWith(that.locate("navBar"), "search-navigation", that.model);

            templates.append(viewport, "search-records", {records: data.records, user: that.model.user});
        }
        else {
            templates.replaceWith(viewport, "search-norecord");
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
            "query":         ".ptd-search-query",
            "sort":          ".ptd-search-sort",
            "status":        ".ptd-search-status",
            "clear":         ".ptd-clear-button",
            "aliasToggle":   ".alias-toggle",
            "statusToggle":  ".ptd-search-status-toggle",
            "statusText":    ".ptd-search-status-current-text",
            "statusSelect":  ".ptd-search-status-selector",
            "navStart":      ".ptd-search-nav-start",
            "navPrevious":   ".ptd-search-nav-previous",
            "pageLinks":     ".ptd-search-page-links",
            "navNext":       ".ptd-search-nav-next",
            "navEnd":        ".ptd-search-nav-end",
            "navPageLink":   ".ptd-search-nav-page-link",
            "navBar":        ".ptd-nav-bar",
            "header":        ".ptd-header",
            "viewport":      ".ptd-viewport"
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
                            offset:   0,
                            limit:    100,
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
            "markupLoaded":      "preventable",
            "navBarLoaded":      "preventable"
        },
        invokers: {
            "toggleAliasRecord": {
                funcName: "ctr.components.search.toggleAliasRecord",
                args: [ "{that}", "{arguments}.0"]
            },
            "changePage": {
                funcName: "ctr.components.search.changePage",
                args: [ "{that}", "{arguments}.0"]
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
            "updateStatusControls": {
                funcName: "ctr.components.search.updateStatusControls",
                args: ["{that}"]
            },
            "updatePagination": {
                funcName: "ctr.components.search.updatePagination",
                args: ["{that}"]
            },
            "toggleStatusControls": {
                funcName: "ctr.components.search.toggleStatusControls",
                args: ["{that}"]
            },
            "showClearButton": {
                funcName: "ctr.components.search.showClearButton",
                args: ["{that}", "{arguments}.0"]
            }
        },
        modelListeners: {
            "searchSettings.offset": [
                {
                    funcName: "ctr.components.search.searchSettingsChanged",
                    excludeSource: "init",
                    args: ["{that}"]
                }
            ],
            "searchSettings.limit": [
                {
                    funcName: "ctr.components.search.clearOffset",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.searchSettingsChanged",
                    excludeSource: "init",
                    args: ["{that}"]
                }
            ],
            "searchSettings.sort": [
                {
                    funcName: "ctr.components.search.clearOffset",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.searchSettingsChanged",
                    excludeSource: "init",
                    args: ["{that}"]
                }
            ],
            "searchSettings.query":    [
                {
                    funcName: "ctr.components.search.clearOffset",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.searchSettingsChanged",
                    excludeSource: "init",
                    args: ["{that}"]
                }
            ],
            "searchSettings.statuses": [
                {
                    funcName: "ctr.components.search.clearOffset",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.updateStatusControls",
                    excludeSource: "init",
                    args: ["{that}"]
                },
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
                },
                {
                    "this": "{that}.dom.statusToggle",
                    method: "click",
                    args:   "{that}.toggleStatusControls"
                },
                {
                    "this": "{that}.dom.statusToggle",
                    method: "keypress",
                    args:   "{that}.toggleStatusControls"
                }
            ],
            navBarLoaded: [
                {
                    "this": "{that}.dom.navPageLink",
                    method: "click",
                    args:   "{that}.changePage"
                },
                {
                    "this": "{that}.dom.navPageLink",
                    method: "keypress",
                    args:   "{that}.changePage"
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
                    funcName: "ctr.components.search.updateStatusControls",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.updatePagination",
                    args: ["{that}"]
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
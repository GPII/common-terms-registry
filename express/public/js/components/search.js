// The main search module that allows users to view the Preference Terms Dictionary
//
// Requires Handlebars.js

(function ($, fluid) {
    "use strict";
    var search = fluid.registerNamespace("ctr.components.search");
    search.templates = { compiled: {} };
    // TODO:  Create session-scoped variables for query, status, record type, and language, and use if no data is provided.

    // Update the results displayed whenever we have new search data
    search.refresh = function(that) {
        // The query values are all stored in the form's DOM.
        // TODO: Review this with Antranig or Justin

        var settings = {
            success: displayResults,
            error:   displayError
        };

        // TODO:  Wire in sorting and filtering to both types of requests
        if (that.model && that.model.input && that.model.input.val()) {
            settings.url = "/api/search";
            settings.data = { q: that.model.input.val()};
        }
        else {
            settings.url = "/api/records?children=true";
        }

        // TODO:  How do we pick up our base URL from the configuration?


        // TODO:  Wire in support for status controls

        // TODO:  Wire in support for record type controls

        $.ajax(settings);
    };

    function displayError(jqXHR, textStatus, errorThrown) {
        prependTemplate("#main-viewport","error",{message: errorThrown});
    }

    // TODO:  Extract the template handling functions to a separate utility library
    function renderTemplate(key,context) {
        // If a template exists, load that.  Otherwise, try to load the partial.
        var element = $("#template-" + key).length ? $("#template-" + key) : $("#partial-" + key);

        // templates are cached the first time they are used per page load
        var template = search.templates.compiled[key] ? search.templates.compiled[key] : Handlebars.compile(element.html());
        return template(context);
    }

    function replaceWithTemplate(el,key,context) {
        $(el).html(renderTemplate(key,context));
    }

    function appendTemplate(el,key,context) {
        $(el).append(renderTemplate(key,context));
    }

    function prependTemplate(el,key,context) {
        $(el).prepend(renderTemplate(key,context));
    }

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
            appendTemplate("#main-viewport","navigation", navData);

            // display each record in the results area
            data.records.forEach(function(record) {
                appendTemplate("#main-viewport","record",record);
            });
        }
        else {
            replaceWithTemplate("#main-viewport","norecord");
        }

        // TODO: add support for pagination or infinite scrolling
    }

    function loadTemplates(){
        var settings = {
          url: "/hbs",
          success: appendTemplates
        };
        $.ajax(settings);
    }

    function appendTemplates(data, textStatus, jqXHR) {
        $("body").append(data);

        // load all partials so that we can use them in context
        $("[id^=partial-]").each(function(index, element) {
            var id = element.id;
            var key = id.substring(id.indexOf("-")+1);
            Handlebars.registerPartial(key,$("#" + id).html());
        });
    }

    search.handleKeys = function(that, event) {
        if (event.which === 13) {
            search.refresh(that);
        }
    };

    loadTemplates();

    fluid.defaults("ctr.components.search", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        selectors: {
            "input":  ".ptd-search-input",
            "button": ".ptd-search-button",
            "results": ".ptd-search-results"
        },
        model: {
            "input": "{that}.dom.input",
            "statuses": [ "active", "unreviewed", "candidate"],
            "type": [ "record"]
        },
        members: {
            "input":  ".ptd-search-input",
            "button": ".ptd-search-button",
            "results": ".ptd-search-results"
        },
        events: {
            "refresh":  "preventable"
        },
        invokers: {
            "refresh": {
                funcName: "ctr.components.search.refresh",
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
                    "this": "{that}.dom.button",
                    method: "click",
                    args: "{that}.refresh"
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
// The main search module that allows users to view the Preference Terms Dictionary

(function ($) {
    "use strict";
    var record    = fluid.registerNamespace("ctr.components.record");
    var templates = fluid.registerNamespace("ctr.components.templates");

    // This should come from a global configuration of some kind
    // Also, I should feel bad for using it.
    record.typeLookups = {
        "general": "term",
        "term": "term",
        "alias": "alias",
        "operator": "operator",
        "translation": "translation",
        "transform": "transform"
    };

    record.load = function(that) {
        if (that.data && that.data.model && that.data.model.record && that.data.model.record.uniqueId) {
            var settings = {
                url:     that.options.baseUrl + "/" + that.data.model.record.uniqueId,
                success: that.displayResults,
                error:   that.displayError
            };

            $.ajax(settings);
        }
    };

    // Save the new version including any comments
    record.save = function(that) {

    };

    // bind in input validation and feedback
    record.validate = function(that) {

    };


    record.displayError = function(that, jqXHR, textStatus, errorThrown) {
        templates.prependTo(that.locate("viewport"),"error",{message: errorThrown});
    };

    record.displayResults = function(that, data, textStatus, jqXHR) {
        var viewport = that.locate("viewport");
        if (data && data.record) {
            that.data.model.record = data.record;
            templates.replaceWith(viewport, "term-detail", { record: that.data.model.record, user: that.data.model.user });
            record.setFormValues(that);

            // TODO:  Add support for all record types
        }
        else {
            templates.replaceWith(viewport, "norecord", {user: that.data.model.user});
        }
    };

    // bind in sanity checking when changing from a term (with aliases) to any other type of record


    // Set the current form values
    record.setFormValues = function(that){
        var type = that.locate("type");
        type.prop("checked",false);

        if (that.data.model.record && that.data.model.record.type) {
            document.forms[0].type.value = record.typeLookups[that.data.model.record.type.toLowerCase()];
        }

        var status = that.locate("status");
        status.prop("checked", false);

        if (that.data.model.record && that.data.model.record.status) {
            document.forms[0].status.value = that.data.model.record.status;
        }
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    record.init = function(that) {
        templates.loadTemplates();
    };

    // TODO:  Wire up comment controls

    // TODO:  Wire up save controls

    fluid.defaults("ctr.components.record", {
        baseUrl: "/api/record",
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        components: {
            data:    { type: "ctr.components.data" },
            profile: { type: "ctr.components.profile", container: ".user-container", options: { components: { data: "{data}" }}}
        },
        selectors: {
            "status":   "input[name='status']",
            "type":     "input[name='type']",
            "viewport": ".ptd-viewport"
        },
        events: {
            "refresh":   "preventable"
        },
        invokers: {
            "displayError": {
                funcName: "ctr.components.record.displayError",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "displayResults": {
                funcName: "ctr.components.record.displayResults",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            }
        },

        listeners: {
            onCreate: [
                {
                    "funcName": "ctr.components.record.init",
                    "args":     "{that}"
                }
            ],
            "refresh": {
                func: "ctr.components.record.load",
                args: [ "{that}"]
            }
        }
    });
})(jQuery);
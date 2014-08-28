// The record viewing and editing interface
(function ($) {
    "use strict";
    var details    = fluid.registerNamespace("ctr.components.details");
    var templates = fluid.registerNamespace("ctr.components.templates");

    // This should come from a global configuration of some kind
    // Also, I should feel bad for using it.
    details.typeLookups = {
        "general": "term",
        "term": "term",
        "alias": "alias",
        "operator": "operator",
        "translation": "translation",
        "transform": "transform"
    };

    details.load = function(that) {
        if (that.data && that.data.model && that.data.model.record && that.data.model.record.uniqueId) {
            var settings = {
                url:     that.options.baseUrl + "/" + that.data.model.record.uniqueId,
                success: that.displayRecord,
                error:   that.displayError
            };

            $.ajax(settings);
        }
    };

    // Save the new version including any comments
    details.save = function(that) {
        var settings = {
            url:     that.options.baseUrl + "/" + that.data.model.record.uniqueId,
            type:    "PUT",
            data:    that.data.model.record,
            success: that.displayConfirmation,
            error:   that.displayError
        };

        $.ajax(settings);
    };

    // bind in input validation and feedback
    details.validate = function(that) {

    };

    details.displayError = function(that, jqXHR, textStatus, errorThrown) {
        var viewport = that.locate("viewport");
        // Clear out any previous messages first.
        $(viewport).find(".alert-box").remove();

        templates.prependTo(viewport,"error",{message: errorThrown});
    };

    details.displayConfirmation = function(that, jqXHR, textStatus, errorThrown) {
        var viewport = that.locate("viewport");
        // Clear out any previous messages first.
        $(viewport).find(".alert-box").remove();

        templates.prependTo(viewport,"success",{message: "Record updated."});
    };

    details.displayRecord = function(that, data, textStatus, jqXHR) {
        var viewport = that.locate("viewport");
        if (data && data.record) {
            that.data.model.record = data.record;
            templates.replaceWith(viewport, "term-detail", { record: that.data.model.record, user: that.data.model.user });
            details.setFormValues(that);

            ctr.components.binding.applyBinding(that);
            // TODO:  Add support for all record types
        }
        else {
            templates.replaceWith(viewport, "norecord", {user: that.data.model.user});
        }

        that.events.markupLoaded.fire();
    };

    // bind in sanity checking when changing from a term (with aliases) to any other type of record


    // Set the current form values for the two radio groups, which we cannot do in our templates
    details.setFormValues = function(that){
        var type = that.locate("type");
        type.prop("checked",false);

        if (that.data.model.record && that.data.model.record.type) {
            document.forms[0].type.value = details.typeLookups[that.data.model.record.type.toLowerCase()];
        }

        var status = that.locate("status");
        status.prop("checked", false);

        if (that.data.model.record && that.data.model.record.status) {
            document.forms[0].status.value = that.data.model.record.status;
        }
    };

    // TODO:  Wire up comment controls

    fluid.defaults("ctr.components.details", {
        baseUrl: "/api/record",
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        components: {
            data:    { type: "ctr.components.data" },
            controls: { type: "ctr.components.userControls", container: ".user-container", options: { components: { data: "{data}" }}}
        },
        bindings: [
            {
                selector:    "status",
                path:        "record.status",
                elementType: "encode different ways of accessing values here"
            },
            {
                selector:    "type",
                path:        "record.type",
                elementType: "encode different ways of accessing values here"
            },
            {
                selector:    "uses",
                path:        "record.uses",
                elementType: "encode different ways of accessing values here"
            },
            {
                selector:    "definition",
                path:        "record.definition",
                elementType: "encode different ways of accessing values here"
            },
            {
                selector:    "termLabel",
                path:        "record.termLabel",
                elementType: "encode different ways of accessing values here"
            },
            {
                selector:    "valueSpace",
                path:        "record.valueSpace",
                elementType: "encode different ways of accessing values here"
            },
            {
                selector:    "defaultValue",
                path:        "record.defaultValue",
                elementType: "encode different ways of accessing values here"
            },
            {
                selector:    "comment",
                path:        "comment",
                elementType: "encode different ways of accessing values here"
            }
        ],
        selectors: {
            "save":         ".save-button",
            "viewport":     ".ptd-viewport",
            "status":       "input[name='status']",
            "type":         "input[name='type']",
            "uses":         "input[name='uses']",
            "uniqueId":     "input[name='uniqueId']",
            "definition":   "[name='definition']",
            "termLabel":    "input[name='termLabel']",
            "valueSpace":   "input[name='valueSpace']",
            "defaultValue": "input[name='defaultValue']",
            "comment":      "input[name='comment']"
        },
        events: {
            "refresh":      "preventable",
            "markupLoaded": "preventable"
        },
        invokers: {
            "save": {
                funcName: "ctr.components.details.save",
                args: [ "{that}"]
            },
            "displayError": {
                funcName: "ctr.components.details.displayError",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "displayRecord": {
                funcName: "ctr.components.details.displayRecord",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "displayConfirmation": {
                funcName: "ctr.components.details.displayConfirmation",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            }
        },
        listeners: {
            markupLoaded: [
                {
                    "this": "{that}.dom.save",
                    method: "click",
                    args:   "{that}.save"
                },
                {
                    "this": "{that}.dom.save",
                    method: "keypress",
                    args:   "{that}.save"
                }
            ],
            onCreate: [
                {
                    "funcName": "ctr.components.templates.loadTemplates"
                }
            ],
            "refresh": {
                func: "ctr.components.details.load",
                args: [ "{that}"]
            }
        }
    });
})(jQuery);
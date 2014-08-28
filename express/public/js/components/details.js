// The record viewing and editing interface
(function ($) {
    "use strict";
    var details    = fluid.registerNamespace("ctr.components.details");
    var templates  = fluid.registerNamespace("ctr.components.templates");

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

    details.addUse = function(that) {
        var newUse = that.locate("addUse");
        if (newUse) {
            var newUses = JSON.parse(JSON.stringify(that.data.model.record.uses));
            newUses.push($(newUse).val());
            that.data.applier.change("record.uses",newUses);

            var usesContainer = that.locate("usesContainer");
            templates.replaceWith(usesContainer, "detail-uses-write", that.data.model);
            that.events.markupLoaded.fire();
        }
    };

    details.removeUse = function(that, event) {
        // "this" should be the item clicked
        // figure out its position

        // This depends on the markup to include a position attribute
        var position = $(event.currentTarget).attr('position');

        if (position) {
            var newUses = JSON.parse(JSON.stringify(that.data.model.record.uses));
            newUses.splice(position,1);
            that.data.applier.change("record.uses",newUses);

            var usesContainer = that.locate("usesContainer");
            templates.replaceWith(usesContainer, "detail-uses-write", that.data.model);
            that.events.markupLoaded.fire();
        }
        else {
            console.log("Couldn't determine list position of use, and as a result couldn't remove it.");
        }

    };

    details.displayError = function(that, jqXHR, textStatus, errorThrown) {
        var viewport = that.locate("viewport");
        // Clear out any previous messages first.
        $(viewport).find(".alert-box").remove();

        templates.replaceWith(viewport, "detail-term", that.data.model);
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
            templates.replaceWith(viewport, "detail-term", that.data.model);
            details.setFormValues(that);

            ctr.components.binding.applyBinding(that);
            // TODO:  Add support for all record types
        }
        else {
            templates.replaceWith(viewport, "norecord", that.data.model);
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
            "save":          ".save-button",
            "addUse":        "input[name='addUse']",
            "removeUse":     ".remove-use",
            "viewport":      ".ptd-viewport",
            "status":        "input[name='status']",
            "type":          "input[name='type']",
            "uses":          "input[name='uses']",
            "usesContainer": ".uses-container",
            "uniqueId":      "input[name='uniqueId']",
            "definition":    "[name='definition']",
            "termLabel":     "input[name='termLabel']",
            "valueSpace":    "input[name='valueSpace']",
            "defaultValue":  "input[name='defaultValue']",
            "comment":       "input[name='comment']"
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
            "addUse": {
                funcName: "ctr.components.details.addUse",
                args: [ "{that}"]
            },
            "removeUse": {
                funcName: "ctr.components.details.removeUse",
                args: [ "{that}", "{arguments}.0"]
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
                    "this": "{that}.dom.addUse",
                    method: "change",
                    args:   "{that}.addUse"
                },
                {
                    "this": "{that}.dom.removeUse",
                    method: "click",
                    args:   "{that}.removeUse"
                },
                {
                    "this": "{that}.dom.removeUse",
                    method: "keypress",
                    args:   "{that}.removeUse"
                },
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
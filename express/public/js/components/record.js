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
        window.alert('no saving at the moment until we wire up our data.');
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


    // Set the current form values for the two radio groups, which we cannot do in our templates
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

//    record.wireFormElements = function(that) {
//        $.each(that.options.selectors,function(key,value){
//            if (that.data.model.record) {
//                var element = that.locate(key);
//                that.data.model.record[key] = element.val();
//                element.bind('change', function() { record.saveFormData(that,key); });
//            }
//        });
//    };

    record.saveFormData = function(that,value) {
      window.alert(value);
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    record.init = function(that) {
//        templates.loadTemplates(function() { record.wireFormElements(that)});
        templates.loadTemplates(ctr.components.applyBinding(that));
    };

    // TODO:  Wire up comment controls

    // TODO:  Wire up save controls


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

    fluid.defaults("ctr.components.record", {
        baseUrl: "/api/record",
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        components: {
            data:    { type: "ctr.components.data" },
            controls: { type: "ctr.components.userControls", container: ".user-container", options: { components: { data: "{data}" }}}
        },
        selectors: {
            "button":       ".save-button",
            "viewport":     ".ptd-viewport"
        },
        events: {
            "refresh":   "preventable"
        },
        invokers: {
            "save": {
                funcName: "ctr.components.record.save",
                args: [ "{that}"]
            },
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
                    "this": "{that}.dom.button",
                    method: "click",
                    args:   "{that}.save"
                },
                {
                    "this": "{that}.dom.button",
                    method: "keypress",
                    args:   "{that}.save"
                },
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
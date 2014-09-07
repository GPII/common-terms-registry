// The main search module that allows users to view the Preference Terms Dictionary

(function ($) {
    "use strict";
    var reset    = fluid.registerNamespace("ctr.components.reset");
    var templates = fluid.registerNamespace("ctr.components.templates");

    // Try to log in and display the results
    reset.submit = function(that, event) {
        // Clear out any previous feedback before submitting
        $(that.container).find(".alert-box").remove();


        if (event) { event.preventDefault(); }
        var email    = that.locate("email").val();
        var settings = {
            type:    "POST",
            url:     that.options.apiUrl + "/forgot",
            success: that.displayReceipt,
            error:   that.displayError,
            data: { "email": email }
        };

        $.ajax(settings);
    };

    // TODO: move this to a general module type that everyone inherits from
    reset.displayError = function(that, jqXHR, textStatus, errorThrown) {
        var message = errorThrown;
        try {
            var jsonData = JSON.parse(jqXHR.responseText);
            if (jsonData.message) { message = jsonData.message; }
        }
        catch (e) {
            console.log("jQuery.ajax call returned meaningless jqXHR.responseText payload. Using 'errorThrown' instead.");
        }

        templates.prependTo(that.locate("form"),"error",{message: message});
    };

    reset.displayReceipt = function(that, responseData, textStatus, jqXHR) {
        var jsonData = JSON.parse(responseData);
        if (jsonData && jsonData.ok) {
            that.applier.change("user",jsonData.user);

            templates.replaceWith(that.locate("viewport"),"success", {message:"Check your email for instructions about resetting your password."});
            that.controls.refresh(that);
        }
        else {
            templates.prependTo(that.locate("form"),"error",{message: jsonData.message});
        }
    };

    reset.refresh = function(that) {
        templates.replaceWith(that.locate("viewport"),"reset-form", that.model);
        that.events.markupLoaded.fire();
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    reset.init = function(that) {
        templates.loadTemplates();
        that.events.markupLoaded.fire();
    };

    fluid.defaults("ctr.components.reset", {
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        components: {
            data:     { type: "ctr.components.data" },
            controls: {
                type: "ctr.components.userControls",
                container: ".user-container",
                options: {
                    components: { data: "{data}" },
                    listeners: {
                        afterLogout:
                        {
                            func: "{ctr.components.reset}.events.refresh.fire"
                        }
                    }
                }
            }
        },
        model: "{data}.model",
        apiUrl: "/api/user",
        selectors: {
            "form":     ".reset-form",
            "viewport": ".ptd-viewport",
            "email":    "input[name='email']"
        },
        events: {
            "submit":       "preventable",
            "refresh":      "preventable",
            "markupLoaded": "preventable"
        },
        invokers: {
            "submit": {
                funcName: "ctr.components.reset.submit",
                args: [ "{that}", "{arguments}.0"]
            },
            "displayError": {
                funcName: "ctr.components.reset.displayError",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "displayReceipt": {
                funcName: "ctr.components.reset.displayReceipt",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "init": {
                funcName: "ctr.components.templates.loadTemplates"
            }
        },
        listeners: {
            onCreate: [
                {
                    "funcName": "ctr.components.reset.init",
                    "args":     "{that}"
                }
            ],
            "markupLoaded": [
                {
                    "this": "{that}.dom.form",
                    method: "submit",
                    args:   "{that}.submit"
                }
            ],
            "submit": {
                func: "ctr.components.reset.submit",
                args: [ "{that}"]
            },
            "refresh": {
                func: "ctr.components.reset.refresh",
                args: [ "{that}"]
            }
        }
    });
})(jQuery);
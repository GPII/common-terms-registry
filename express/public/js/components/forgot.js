// Allow users to request that their password be reset...

(function ($) {
    "use strict";
    var forgot    = fluid.registerNamespace("ctr.components.forgot");
    var templates = fluid.registerNamespace("ctr.components.templates");

    // Try to log in and display the results
    forgot.submit = function(that, event) {
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
    forgot.displayError = function(that, jqXHR, textStatus, errorThrown) {
        var message = errorThrown;
        try {
            var jsonData = JSON.parse(jqXHR.responseText);
            if (jsonData.message) { message = jsonData.message; }
        }
        catch (e) {
            console.log("jQuery.ajax call returned meaningless jqXHR.responseText payload. Using 'errorThrown' instead.");
        }

        templates.prepend(that.locate("form"),"common-error", message);
    };

    forgot.displayReceipt = function(that, responseData, textStatus, jqXHR) {
        var jsonData = JSON.parse(responseData);
        if (jsonData && jsonData.ok) {
            that.applier.change("user",jsonData.user);

            templates.replaceWith(that.locate("viewport"),"success", {message:"Check your email for instructions about resetting your password."});
            that.controls.refresh(that);
        }
        else {
            templates.prepend(that.locate("form"),"common-error", jsonData.message);
        }
    };

    forgot.refresh = function(that) {
        templates.replaceWith(that.locate("viewport"),"forgot-form", that.model);
        that.events.markupLoaded.fire();
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    forgot.init = function(that) {
        templates.loadTemplates();
        that.events.markupLoaded.fire();
    };

    fluid.defaults("ctr.components.forgot", {
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        components: {
            data:     { type: "ctr.components.data" },
            controls: {
                type: "ctr.components.userControls",
                container: ".ptd-user-container",
                options: {
                    components: { data: "{data}" },
                    listeners: {
                        afterLogout:
                        {
                            func: "{ctr.components.forgot}.events.refresh.fire"
                        }
                    }
                }
            }
        },
        model: "{data}.model",
        apiUrl: "/api/user",
        selectors: {
            "form":     ".forgot-form",
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
                funcName: "ctr.components.forgot.submit",
                args: [ "{that}", "{arguments}.0"]
            },
            "displayError": {
                funcName: "ctr.components.forgot.displayError",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "displayReceipt": {
                funcName: "ctr.components.forgot.displayReceipt",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "init": {
                funcName: "ctr.components.templates.loadTemplates"
            }
        },
        listeners: {
            onCreate: [
                {
                    "funcName": "ctr.components.forgot.init",
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
                func: "ctr.components.forgot.submit",
                args: [ "{that}"]
            },
            "refresh": {
                func: "ctr.components.forgot.refresh",
                args: [ "{that}"]
            }
        }
    });
})(jQuery);
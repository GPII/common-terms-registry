// The main search module that allows users to view the Preference Terms Dictionary

(function ($) {
    "use strict";
    var signup    = fluid.registerNamespace("ctr.components.signup");
    var templates = fluid.registerNamespace("ctr.components.templates");

    // Try to log in and display the results
    signup.submit = function(that, event) {
        // Clear out any previous feedback before submitting
        $(that.container).find(".alert-box").remove();


        if (event) { event.preventDefault(); }
        var name     = that.locate("name").val();
        var email    = that.locate("email").val();
        var password = that.locate("password").val();
        var confirm  = that.locate("confirm").val();

        // Our user handling library doesn't offer password confirmation, so we have to do it ourselves for now
        if (password !== confirm) {
            signup.displayError(that, null, null, "The passwords you have entered don't match.");
            return;
        }

        // TODO: Fix it so that we don't have to submit bogus roles to create a user correctly (jQuery is stripping empty data).
        var settings = {
            type:    "POST",
            url:     that.options.apiUrl + "/signup",
            success: that.displayReceipt,
            error:   that.displayError,
            data: { name: name, "password": password, "email": email, "roles": ["user"] }
        };

        $.ajax(settings);
    };

    signup.displayError = function(that, jqXHR, textStatus, errorThrown) {
        var message = errorThrown;
        try {
            var jsonData = JSON.parse(jqXHR.responseText);
            if (jsonData.message) { message = jsonData.message; }
        }
        catch (e) {
            console.log("jQuery.ajax call returned meaningless jqXHR.responseText payload. Using 'errorThrown' instead.");
        }

        templates.prepend(that.locate("form"),"common-error",message);
    };

    signup.displayReceipt = function(that, responseData, textStatus, jqXHR) {
        var jsonData = JSON.parse(responseData);
        if (jsonData && jsonData.ok) {
            that.applier.change("user",jsonData.user);

            templates.replaceWith(that.locate("viewport"),"success", {message:"You have created an account. Check your email for details about verifying your new account."});
            that.controls.refresh(that);
        }
        else {
            templates.prependTo(that.locate("form"),"common-error", jsonData.message);
        }
    };

    signup.refresh = function(that) {
        templates.replaceWith(that.locate("viewport"),"signup-form", that.model);
        that.events.markupLoaded.fire();
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    signup.init = function(that) {
        templates.loadTemplates();
        that.events.markupLoaded.fire();
    };

    fluid.defaults("ctr.components.signup", {
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
                            func: "{ctr.components.signup}.events.refresh.fire"
                        }
                    }
                }
            }
        },
        model: "{data}.model",
        apiUrl: "/api/user",
        selectors: {
            "form":     ".signup-form",
            "viewport": ".ptd-viewport",
            "name":     "input[name='username']",
            "email":    "input[name='email']",
            "password": "input[name='password']",
            "confirm":  "input[name='confirm']"
        },
        events: {
            "submit":       "preventable",
            "refresh":      "preventable",
            "markupLoaded": "preventable"
        },
        invokers: {
            "submit": {
                funcName: "ctr.components.signup.submit",
                args: [ "{that}", "{arguments}.0"]
            },
            "displayError": {
                funcName: "ctr.components.signup.displayError",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "displayReceipt": {
                funcName: "ctr.components.signup.displayReceipt",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "init": {
                funcName: "ctr.components.templates.loadTemplates"
            }
        },
        listeners: {
            onCreate: [
                {
                    "funcName": "ctr.components.signup.init",
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
                func: "ctr.components.signup.submit",
                args: [ "{that}"]
            },
            "refresh": {
                func: "ctr.components.signup.refresh",
                args: [ "{that}"]
            }
        }
    });
})(jQuery);
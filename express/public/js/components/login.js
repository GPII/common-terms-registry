// The main search module that allows users to view the Preference Terms Dictionary

(function ($) {
    "use strict";
    var login       = fluid.registerNamespace("ctr.components.login");
    var templates   = fluid.registerNamespace("ctr.components.templates");

    // Try to log in and display the results
    login.submit = function(that, event) {
        // Clear out any previous feedback before submitting
        $(that.container).find(".alert-box").remove();

        if (event) { event.preventDefault(); }
        var name = that.locate("name").val();
        var password = that.locate("password").val();
        var settings = {
            type:    "POST",
            url:     that.options.apiUrl + "/signin",
            success: that.displayReceipt,
            error:   that.displayError,
            data: { name: name, "password": password }
        };

        $.ajax(settings);
    };

    login.displayError = function(that, jqXHR, textStatus, errorThrown) {
        templates.prependTo(that.locate("form"),"error",{message: errorThrown});
    };

    login.displayReceipt = function(that, responseData, textStatus, jqXHR) {
        var jsonData = JSON.parse(responseData);
        if (jsonData && jsonData.ok) {
            templates.replaceWith(that.locate("viewport"),"success", { message: "You have succesfully logged in."});

            // update our common session data regarding the logged in user, so that other components can pick up changes.
            that.data.model.user = jsonData.user;
            that.profile.refresh(that);
        }
        else {
            templates.prependTo(that.locate("form"),"error",{message: jsonData.message});
        }
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    login.init = function(that) {
        templates.loadTemplates();
    };

    fluid.defaults("ctr.components.login", {
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        components: {
            data:    { type: "ctr.components.data" },
            profile: { type: "ctr.components.profile", container: ".user-container", options: { components: { data: "{data}" }}}
        },
        apiUrl: "/api/user",
        selectors: {
            "form":     ".login-form",
            "viewport": ".ptd-viewport",
            "name":     "input[name='username']",
            "password": "input[name='password']"
        },
        events: {
            "submit":   "preventable"
        },
        invokers: {
            "submit": {
                funcName: "ctr.components.login.submit",
                args: [ "{that}", "{arguments}.0"]
            },
            "displayError": {
                funcName: "ctr.components.login.displayError",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "displayReceipt": {
                funcName: "ctr.components.login.displayReceipt",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "init": {
                funcName: "ctr.components.search.init",
                args: ["{that}"]
            }
        },
        listeners: {
            onCreate: [
                {
                    "this": "{that}.dom.form",
                    method: "submit",
                    args:   "{that}.submit"
                },
                {
                    "funcName": "ctr.components.login.init",
                    "args":     "{that}"
                }
            ],
            "submit": {
                func: "ctr.components.login.submit",
                args: [ "{that}"]
            }
        }
    });
})(jQuery);
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
        var name     = that.locate("name").val();
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

    login.displayReceipt = function(that, responseData, textStatus, jqXHR) {
        var jsonData = JSON.parse(responseData);
        if (jsonData && jsonData.ok) {
            that.applier.change("user",jsonData.user);

            templates.replaceWith(that.locate("viewport"),"login-form", that.model);
            that.controls.refresh(that);
        }
        else {
            templates.prependTo(that.locate("form"),"error",{message: jsonData.message});
        }
    };

    login.refresh = function(that) {
        templates.replaceWith(that.locate("viewport"),"login-form", that.model);
        that.events.markupLoaded.fire();
    };

    // We have to do this because templates need to be loaded before we initialize our own code.
    login.init = function(that) {
        templates.loadTemplates();
        that.events.markupLoaded.fire();
    };

    fluid.defaults("ctr.components.login", {
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
                            func: "{ctr.components.login}.events.refresh.fire"
                        }
                    }
                }
            }
        },
        model: "{data}.model",
        apiUrl: "/api/user",
        selectors: {
            "form":     ".login-form",
            "viewport": ".ptd-viewport",
            "name":     "input[name='username']",
            "password": "input[name='password']"
        },
        events: {
            "submit":       "preventable",
            "refresh":      "preventable",
            "markupLoaded": "preventable"
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
                funcName: "ctr.components.templates.loadTemplates"
            }
        },
        listeners: {
            onCreate: [
                {
                    "funcName": "ctr.components.login.init",
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
                func: "ctr.components.login.submit",
                args: [ "{that}"]
            },
            "refresh": {
                func: "ctr.components.login.refresh",
                args: [ "{that}"]
            }
        }
    });
})(jQuery);
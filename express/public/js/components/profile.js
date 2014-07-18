(function ($, fluid) {
    "use strict";
    fluid.registerNamespace("ctr.components.profile");

    ctr.components.profile.login = function(that) {
        // Get the user information and update the model

        // Update the affected fields

        // toggle the login and logout buttons
    };

    ctr.components.profile.logout = function(that) {
        // Get the user information and update the model

        // Update the affected fields

        // toggle the login and logout buttons
    };

    // toggle the dropdown for additional options
    ctr.components.profile.toggle = function(that) {
        that.locate("menu").toggle();
    };

    // TODO:  Tie change in model (login/logout) to change in display onscreen.

    fluid.defaults("ctr.components.profile", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        selectors: {
            "username": ".profile-username",
            "toggle":   ".profile-toggle",
            "menu":     ".profile-menu"
        },
        members: {
            "toggle":   ".profile-toggle"
        },
        model: {
            user: {
                "username": "anonymous",
                "name":     "Anonymous"
            }
        },
        events: {
            "login":    "preventable",
            "logout":   "preventable",
            "toggle":   null
        },
        invokers: {
            "toggle": {
                funcName: "ctr.components.profile.toggle",
                args: [ "{that}"]
            }
        },
        listeners: {
            onCreate: [
                {
                    "this": "{that}.dom.toggle",
                    method: "click",
                    args: "{that}.toggle"
                }
            ],
            "login": {
                func: "ctr.components.profile.login"
            },
            "logout": {
                func: "ctr.components.profile.logout"
            },
            "toggle": {
                func: "ctr.components.profile.toggle",
                args: [ "{that}"]
            }
        }
    });
})(jQuery, fluid_1_5);
(function ($, fluid) {
    "use strict";
    fluid.registerNamespace("ctr.components");

    var profile;
    profile.login = function(that) {
        // Get the user information and update the model

        // Update the affected fields

        // toggle the login and logout buttons
    };

    profile.logout = function(that) {
        // Get the user information and update the model

        // Update the affected fields

        // toggle the login and logout buttons
    };

    profile.toggle = function(that) {

    };

    fluid.defaults("ctr.components.profile", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        selectors: {
            "username": "#profile-name",
            "profile": "#profile-profile"
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
        protoTree: {
            username: "${user.username}",
            profile: "${user.email}"
        },
        modelListeners: {
            "login": {
                func: "{that}.refreshView"
            },
            "logout": {
                func: "{that}.refreshView"
            },
            "toggle": {
                func: "{that}.refreshView"
            }
        },
        renderOnInit: true
    });
})(jQuery, fluid_1_5);
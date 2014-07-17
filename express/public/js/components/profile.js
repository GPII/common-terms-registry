"use strict";
(function ($, fluid) {
    fluid.registerNamespace("ctr.components");

    fluid.defaults("ctr.components.profile", {
        gradeNames: ["fluid.rendererComponent", "autoInit"],
        selectors: {
            "icon": "#profile-icon",
            "username": "#profile-name",
            "profile": "#profile-profile",
            "login": "#profile-login",
            "logout": "#profile-logout",
            "toggle": "#profile-toggle"
        },
        model: {
            user: {
                "username": "admin",
                "type": "user",
                "name": "admin",
                "email": "tony@raisingthefloor.org",
                "roles": [ "admin" ],
                "signupTimestamp": "2014-01-03T17:59:23.634Z",
                "failedLoginAttempts": 0,
                "emailVerificationTimestamp": "2014-01-03T18:00:30.787Z",
                "emailVerified": true
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
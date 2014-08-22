(function ($) {
    "use strict";
    var profile   = fluid.registerNamespace("ctr.components.profile");
    var templates = fluid.registerNamespace("ctr.components.templates");

    //TODO:  Bind this so that we can update ourselves if the user changes in the background

    profile.logout = function(that) {
        that.data.applier.change("user", undefined);
        that.data.model.user = undefined;

        // Fire the REST call that logs a user out, refresh afterward
        var settings = {
            type:    "POST",
            url:     that.options.apiUrl + "/signout",
            success: that.refresh,
            error:   that.refresh
        };
        $.ajax(settings);
    };

    // After we have our markup in place, wire it up
    profile.init = function(that) {
        // Evolve our select using jquery.dropBox


        // Wire up actions based on classes
    };

    // Update markup and wiring after a change in user status (login/logout, profile update)
    profile.refresh = function(that) {
        templates.replaceWith(that.container,"profile", {user: that.data.model.user});

        // Redo all our evolvers and bindings
        profile.init(that);
    };

    // TODO:  Tie change in model (login/logout) to change in display onscreen.

    fluid.defaults("ctr.components.profile", {
        apiUrl:    "/api/user",
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        selectors: {
            "badge":     ".user-badge",
            "menu":      ".user-menu",
            "logout":    ".user-menu-logout"
        },
        components: {
            data: { type: "ctr.components.data" }
        },
        events: {
            "logout":   "preventable",
            "refresh":  "preventable"
        },
        invokers: {
            "logout": {
                funcName: "ctr.components.profile.logout",
                args: [ "{that}"]
            },
            "refresh": {
                funcName: "ctr.components.profile.refresh",
                args: [ "{that}"]
            },
            "init": {
                funcName: "ctr.components.profile.init",
                args: [ "{that}"]
            }
        },
        listeners: {
            onCreate: [
                {
                    "funcName": "ctr.components.profile.init",
                    "args":     "{that}"
                },
                {
                    "this": "{that}.dom.logout",
                    method: "click",
                    args:   "{that}.logout"
                }
            ],
            "refresh": {
                func: "ctr.components.profile.refresh"
            },
            "logout": {
                func: "ctr.components.profile.logout",
                "args" : "{that}"
            }
        }
    });
})(jQuery);
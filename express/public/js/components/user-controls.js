(function ($) {
    "use strict";
    var controls  = fluid.registerNamespace("ctr.components.userControls");
    var templates = fluid.registerNamespace("ctr.components.templates");

    //TODO:  Bind this so that we can update ourselves if the user changes in the background

    controls.logout = function(that) {
        that.data.applier.change("user", undefined);
        that.data.model.user = undefined;

        // Fire the REST call that logs a user out, refresh afterward
        var settings = {
            type:    "POST",
            url:     that.options.apiUrl + "/signout",
            success: that.logoutAndRefresh,
            error:   that.logoutAndRefresh
        };
        $.ajax(settings);
    };

    // After we have our markup in place, wire it up
    controls.init = function(that) {
        // TODO: Evolve our select using jquery.dropBox
        that.events.markupLoaded.fire();
    };

    controls.logoutAndRefresh = function(that) {
        that.events.afterLogout.fire();

        that.refresh(that);
    };

    // Update markup and wiring after a change in user status (login/logout, profile update)
    controls.refresh = function(that) {
        templates.replaceWith(that.container,"profile", {user: that.data.model.user});
        that.events.markupLoaded.fire();
    };

    fluid.defaults("ctr.components.userControls", {
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
            "logout":       "preventable",
            "afterLogout":  "preventable",
            "refresh":      "preventable",
            "markupLoaded": "preventable"
        },
        invokers: {
            "logout": {
                funcName: "ctr.components.userControls.logout",
                args: [ "{that}"]
            },
            "logoutAndRefresh": {
                funcName: "ctr.components.userControls.logoutAndRefresh",
                args: [ "{that}"]
            },
            "refresh": {
                funcName: "ctr.components.userControls.refresh",
                args: [ "{that}"]
            },
            "init": {
                funcName: "ctr.components.userControls.init",
                args: [ "{that}"]
            }
        },
        listeners: {
            onCreate: [
                {
                    "funcName": "ctr.components.userControls.init",
                    "args":     "{that}"
                }
            ],
            "markupLoaded": [
                {
                    "this": "{that}.dom.logout",
                    method: "click",
                    args:   "{that}.logout"
                }
            ],
            "refresh": {
                func: "ctr.components.userControls.refresh"
            },
            "logout": {
                func: "ctr.components.userControls.logout",
                "args" : "{that}"
            }
        }
    });
})(jQuery);
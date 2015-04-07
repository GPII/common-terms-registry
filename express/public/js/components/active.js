// A simple component to highlight the "current page" if it's found in the header.
/* global ctr, fluid, jQuery */
(function ($) {
    "use strict";
    fluid.registerNamespace("ctr.components.activePage");

    ctr.components.activePage.highlightActivePage = function(that) {
        ctr.components.templates.loadTemplates(function() {
            // Go through the list of header links
            var headerItems = that.locate("headerItem");
            for (var a = 0; a < headerItems.length; a++) {
                var item = headerItems[a];
                ctr.components.activePage.checkItem(that, item);
            }
        });
    };

    ctr.components.activePage.checkItem = function(that, element) {
        var pagePath = window.location.pathname;
        var link = $(element).find("a")[0];
        if (link) {
            var linkPath = ctr.components.activePage.getLinkPath(link.href);

            // If we're the current page, flag us as active
            if (pagePath === linkPath) {
                $(element).addClass(that.options.activeClass);
            }
            // Otherwise, make sure we're not set as "active".
            else {
                $(element).removeClass(that.options.activeClass);
            }
        }
    };

    ctr.components.activePage.getLinkPath = function(fullPath) {
        var regexp = new RegExp("https?://[^/]+(/[^?]*)", "i");
        var matches = fullPath.match(regexp);
        if (matches) {
            return matches[1];
        }

        return fullPath;
    };

    // TODO:  Wire up comment controls

    fluid.defaults("ctr.components.activePage", {
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        selectors: {
            "headerItem": ".ptd-header-item-to-pad"
        },
        activeClass: "ptd-header-active-page",
        listeners: {
            "onCreate.highlightActivePage": [
                {
                    funcName: "ctr.components.activePage.highlightActivePage",
                    args:     ["{that}"]
                }
            ]
        }
    });
})(jQuery);
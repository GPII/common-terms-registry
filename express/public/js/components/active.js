// A simple component to highlight the "current page", that:
//
// 1. Looks for elements matching `options.selectors.headerItem`
// 2. Examines any links the header elements contain.
// 3. Compares the trimmed path of the link's href attribute (with no query data, etc.) to `window.location.path`
// 4. If the path matches, adds the class defined in `options.activeClass` to the container
// 5. If no matching paths are found, removes the class from the container.
/* global ctr, fluid, jQuery */
(function ($) {
    "use strict";
    fluid.registerNamespace("ctr.components.activePage");

    ctr.components.activePage.highlightActivePage = function(that) {
        ctr.components.templates.loadTemplates(function() {
            // Go through the list of header items
            var headerItems = that.locate("headerItem");
            for (var a = 0; a < headerItems.length; a++) {
                var item = headerItems[a];
                ctr.components.activePage.checkItem(that, item);
            }
        });
    };

    ctr.components.activePage.checkItem = function(that, element) {
        var pagePath = window.location.pathname;
        var links = $(element).find("a");

        var isActive = false;
        for (var a=0; a < links.length; a++) {
            var link = links[a];
            var linkPath = ctr.components.activePage.getLinkPath(link.href);

            if (pagePath === linkPath) {
                isActive = true;
            }
        }

        if (isActive) {
            $(element).addClass(that.options.activeClass);
        }
        else {
            $(element).removeClass(that.options.activeClass);
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
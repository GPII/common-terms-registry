// The main search module that allows users to view the Preference Terms Dictionary

(function ($) {
    "use strict";
    var record    = fluid.registerNamespace("ctr.components.record");

    // Save the new version including any comments
    record.save = function(that) {

    };

    // bind in input validation and feedback
    record.validate = function(that) {

    };

    // bind in sanity checking when changing from a term (with aliases) to any other type of record


    fluid.defaults("ctr.components.record", {
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        model: {
        },
        selectors: {
        },
        events: {
        },
        invokers: {
        },
        modelListeners: {
        },
        listeners: {
        }
    });
})(jQuery);
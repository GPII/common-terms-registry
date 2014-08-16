// The main search module that allows users to view the Preference Terms Dictionary

(function ($) {
    "use strict";
    var record    = fluid.registerNamespace("ctr.components.record");
    var templates = fluid.registerNamespace("ctr.components.templates");

    // This should come from a global configuration of some kind
    // Also, I should feel bad for using it.
    record.typeLookups = {
        "general": "term",
        "alias": "alias",
        "operator": "operator",
        "translation": "translation",
        "transform": "transform"
    };

    record.load = function(that) {
        if (ctr.data.record.uniqueId) {
            var settings = {
                url:     that.options.baseUrl + "/" + ctr.data.record.uniqueId,
                success: that.displayResults,
                error:   that.displayError
            };

            $.ajax(settings);
        }
    };

    // Save the new version including any comments
    record.save = function(that) {

    };

    // bind in input validation and feedback
    record.validate = function(that) {

    };


    record.displayError = function(that, jqXHR, textStatus, errorThrown) {
        templates.prependTo(that.locate("viewport"),"error",{message: errorThrown});
    };

    record.displayResults = function(that, data, textStatus, jqXHR) {
        var viewport = that.locate("viewport");
        if (data && data.record) {
            that.model.record = data.record;
            templates.replaceWith(viewport, "term-detail", { record: data.record, user: ctr.data.user });
            record.selectType(that);
            record.selectStatus(that);

            // TODO:  Add support for all record types

            // TODO:  Preserve data somehow when switching record types
        }
        else {
            templates.replaceWith(viewport, "norecord", {user: ctr.data.user});
        }
    };

    // bind in sanity checking when changing from a term (with aliases) to any other type of record


    // TODO:  Wire up record type controls
    record.selectType = function(that){
        var type = that.locate("type");
        type.removeClass("active");

        if (that.model.record && that.model.record.type) {
            type.each(function(index,entry) {
                if ($(entry).text().toLowerCase().indexOf(record.typeLookups[that.model.record.type.toLowerCase()]) !== -1) {
                    $(entry).addClass("active");
                }
            });
        }
    };

    // TODO:  Wire up status controls
    record.selectStatus = function(that){
        var status = that.locate("status");
        status.removeClass("active");

        if (that.model.record && that.model.record.status) {
            status.each(function(index,entry) {
                if ($(entry).text().indexOf(that.model.record.status) !== -1) {
                    $(entry).addClass("active");
                }
            });
        }
    };

    // TODO:  Wire up comment controls

    // TODO:  Wire up save controls

    fluid.defaults("ctr.components.record", {
        baseUrl: "/api/record",
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        model: {
        },
        selectors: {
            "status":   ".status",
            "type":     ".type",
            "viewport": ".ptd-viewport"
        },
        events: {
            "refresh":   "preventable"
        },
        invokers: {
            "displayError": {
                funcName: "ctr.components.record.displayError",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "displayResults": {
                funcName: "ctr.components.record.displayResults",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            }
        },
        modelListeners: {
        },
        listeners: {
            "refresh": {
                func: "ctr.components.record.load",
                args: [ "{that}"]
            }
        }
    });
})(jQuery);
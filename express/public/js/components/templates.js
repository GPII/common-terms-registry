// A template handling library that brings in all Handlebars templates and partials and adds functions for more easily using them.
//
// Requires Handlebars.js

(function ($, fluid) {
    "use strict";
    var templates = fluid.registerNamespace("ctr.components.templates");
    templates.compiled = {};

    templates.render = function(key,context) {
        // If a template exists, load that.  Otherwise, try to load the partial.
        var element = $("#template-" + key).length ? $("#template-" + key) : $("#partial-" + key);

        // templates are cached the first time they are used per page load
        var template = templates.compiled[key] ? templates.compiled[key] : Handlebars.compile(element.html());
        return template(context);
    };

    templates.replaceWith = function(el,key,context) {
        $(el).html(templates.render(key,context));
    };

    templates.appendTo = function(el,key,context) {
        $(el).append(templates.render(key,context));
    };

    templates.prependTo = function (el,key,context) {
        $(el).prepend(templates.render(key,context));
    };

    templates.appendToBody = function (data, textStatus, jqXHR) {
        $("body").append(data);

        // load all partials so that we can use them in context
        $("[id^=partial-]").each(function(index, element) {
            var id = element.id;
            var key = id.substring(id.indexOf("-")+1);
            Handlebars.registerPartial(key,$("#" + id).html());
        });
    };

    templates.loadTemplates = function(){
        var settings = {
            url: "/hbs",
            success: templates.appendToBody
        };
        $.ajax(settings);
    };

    templates.loadTemplates();
})(jQuery, fluid_1_5);



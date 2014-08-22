// A template handling library that brings in all Handlebars templates and partials and adds functions for more easily using them.
//
// Requires Handlebars.js and Pagedown (for markdown rendering)

(function ($) {
    "use strict";
    var templates = fluid.registerNamespace("ctr.components.templates");
    templates.compiled = {};


    // Add support for markdown if pagedown is available
    templates.mdHelper = function(options) {
        if (Markdown && Markdown.getSanitizingConverter) {
            var converter = Markdown.getSanitizingConverter();
            // Double all single carriage returns so that they result in new paragraphs, at least for now
            converter.hooks.chain("preConversion", function (text) { return text.replace(/[\r\n]+/g, "\n\n"); });
            return converter.makeHtml(options.fn(this));
        }
        else {
            console.log("Pagedown or one of its dependencies is not available, so markdown will be passed on without any changes.");
        }

        // If we can't evolve the output, we just pass it through.
        return options.fn(this);
    };

    Handlebars.registerHelper('md', templates.mdHelper);

    templates.render = function(key,context) {
        // If a template exists, load that.  Otherwise, try to load the partial.
        var element = $("#template-" + key).length ? $("#template-" + key) : $("#partial-" + key);

        // Cache each compiled template the first time we use it...
        if (templates.compiled[key]) {
            return templates.compiled[key](context);
        }
        else {
            if (!element || !element.html()) {
                console.log("Template '" + key + "' does not have any content. Skipping");
                return;
            }

            var template = Handlebars.compile(element.html());
            templates.compiled[key] = template;
            return template(context);
        }
    };

    templates.replaceWith = function(element,key,context) {
        element.html(templates.render(key,context));
    };

    templates.appendTo = function(element,key,context) {
        element.append(templates.render(key,context));
    };

    templates.prependTo = function (element,key,context) {
        element.prepend(templates.render(key,context));
    };

    templates.appendToBody = function (data, textStatus, jqXHR) {
        // TODO:  Replace this with a {that} reference
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
})(jQuery);



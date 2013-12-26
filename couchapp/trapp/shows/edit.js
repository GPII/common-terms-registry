function(doc,req) {
    var handlebars = require('vendor/handlebars/lib/handlebars');
    handlebars.registerHelper('json', function(context) {
        return JSON.stringify(context);
    });

    var data = {};
    if (doc !== null && doc !== undefined) { data = doc; }

    // TODO:  Convert to a model library and standardize these better
    data.types = [
        {
            value: "GENERAL",
            label: "Term",
            iconClass: "glyphicon-tree-deciduous",
            selected: data.type && data.type === "GENERAL"
        },
        {
            value: "ALIAS",
            label: "Alias",
            iconClass: "glyphicon-leaf",
            selected: data.type && data.type === "ALIAS"
        },
        {
            value: "TRANSLATION",
            label: "Translation",
            iconClass: "glyphicon-globe",
            selected: data.type && data.type === "TRANSLATION"
        },
        {
            value: "OPERATOR",
            label: "Operator",
            iconClass: "glyphicon-tower",
            selected: data.type && data.type === "OPERATOR"
        },
        {
            value: "TRANSFORMATION",
            label: "Transformation",
            iconClass: "glyphicon-flash",
            selected: data.type && data.type === "TRANSFORMATION"
        }
    ];

    // Templates are logic-less, meaning they can't handle anything but simple boolean flags and null checks themselves.
    data.isGeneral        = data.type && data.type === "GENERAL";
    data.isAlias          = data.type && data.type === "ALIAS";
    data.isTranslation    = data.type && data.type === "TRANSLATION";
    data.isOperator       = data.type && data.type === "OPERATOR";
    data.isTransformation = data.type && data.type === "TRANSFORMATION";

    data.statuses = [
        {
            value: "active",
            label: "Active",
            iconClass: "glyphicon-check",
            selected: data.status && data.status === "active"
        },
        {
            value: "candidate",
            label: "Candidate",
            iconClass: "glyphicon-unchecked",
            selected: data.status && data.status === "candidate"
        },
        {
            value: "unreviewed",
            label: "Unreviewed",
            iconClass: "glyphicon-question-sign",
            selected: data.status && data.status === "unreviewed"
        },
        {
            value: "deleted",
            label: "Deleted",
            iconClass: "glyphicon-trash",
            selected: data.status && data.status === "deleted"
        }
    ];

    data.isActive     = data.status && data.status === "active";
    data.isCandidate  = data.status && data.status === "candidate";
    data.isUnreviewed = data.status && data.status === "unreviewed";
    data.isDeleted    = data.status && data.status === "deleted";

    return handlebars.compile(this.templates.edit)(data);
}
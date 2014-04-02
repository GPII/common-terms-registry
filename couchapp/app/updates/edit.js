function(previous, request) {
    var doc = {};
    doc = request.form;

    if (doc.aliases !== undefined) {
        doc.aliases = JSON.parse(doc.aliases);
    }

    return([doc, JSON.stringify(request)]);
}
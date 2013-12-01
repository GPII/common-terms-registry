function(previous, request) {
    var doc = {};
    doc = request.form;

    return([doc, JSON.stringify(request)]);
}
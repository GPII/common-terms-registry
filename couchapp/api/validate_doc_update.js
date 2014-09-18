// Rules that control what record content can be stored in Couch for the Common Terms Registry
function(newDoc, oldDoc, userCtx) {
    // The user has to be logged in to perform updates
    if (!userCtx || userCtx.name === null) {
        throw({"unauthorized" : {"summary": "You must be logged in to add or edit records."}});
    }
    else {
        // We only allow couch admins to perform actual deletes
        if(newDoc._deleted === true && (!userCtx.roles || userCtx.roles.indexOf("_admin") === -1)) {
            throw({"unauthorized": {"summary" : "Only admins are allowed to directly remove records."}});
        }
    }
}
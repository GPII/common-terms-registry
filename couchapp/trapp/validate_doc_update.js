function(newDoc, oldDoc, userCtx) {
    // The user has to be logged in to perform updates
    if (!userCtx) {
        throw({"unauthorized" : "You must be logged in to add or edit records."});
    }
    else {
        // If the user is logged in, we report remaining errors all at once
        var errors = [];

        var ValidTypes = ["ALIAS", "ALIASTRANSFORMATION","TRANSLATION","GENERAL","OPERATOR"];

        /* The record type can never be null, and must be one of the following:
         ALIAS
         ALIASTRANSFORMATION
         TRANSLATION
         GENERAL
         OPERATOR
         */

        if (!newDoc.type) {
            errors.push({"type" : "Record type is required."});
        }
        else {
            if (ValidTypes.indexOf(newDoc.type) == -1) {
                errors.push({"type" : "Record type '" + newDoc.type + "' (was '" + oldDoc.type + "') is not valid."});
            }
        }

        if (!newDoc.status) {
            errors.push({"status" : "Status is required."});
        }

        // The uniqueId can never be null
        if (!newDoc.uniqueId) {
            errors.push({"uniqueId" : "Unique ID is required."});
        }
        else {
            // if the record type is GENERAL, the uniqueId must be in lowerCamelCase
            if (newDoc.type && newDoc.type == "GENERAL" && !isLowerCamelCase(newDoc.uniqueId)) {
                errors.push({"uniqueId" : "Unique ID '" + newDoc.uniqueId + "' is not in lowerCamelCase."});
            }
        }

        // if the record type is GENERAL, the definition must not be null
        if (!newDoc.definition && newDoc.type && newDoc.type == "GENERAL") {
            errors.push({"definition" : "Terms must have a definition."});
        }

        // if the record type is ALIAS or ALIASTRANSFORMATION, a definition is not allowed
        if (newDoc.definition && newDoc.type && (newDoc.type == "ALIAS" || newDoc.type == "ALIASTRANSFORMATION") ) {
            errors.push({"definition" : "Aliases and transformations are not allowed to have a definition."});
        }

        // if the record type is not GENERAL, no defaultValue is allowed
        if (newDoc.defaultValue && newDoc.type && newDoc.type !== "GENERAL") {
            errors.push({"defaultValue" : "Default values are only allowed for terms."});
        }

        // if the record type is ALIAS or ALIASTRANSFORMATION, the aliasOf field must not be null and must be in lowerCamelCase
        if (newDoc.type == "ALIAS" || newDoc.type == "ALIASTRANSFORMATION") {
            if (!newDoc.aliasOf) {
                errors.push({"aliasOf" : "The aliasOf field cannot be empty for an alias."});
            }
            else if (!isLowerCamelCase(newDoc.aliasOf)) {
                errors.push({"aliasOf" : "The aliasOf field must be in lowerCamelCase."});
            }
        }
        else {
            // if the record type is not an ALIAS or ALIASTRANSFORMATION, the aliasOf field is not allowed
            if (newDoc.aliasOf) {
                errors.push({"aliasOf" : "The aliasOf field is only allowed for aliases."});
            }
        }

        // if the record type is TRANSLATION, the translationOf field must not be null and must be in lowerCamelCase
        if (newDoc.type == "TRANSLATION") {
            if (!newDoc.translationOf) {
                errors.push({"translationOf" : "The translationOf field cannot be empty for a translation."});
            }
            else if (!isLowerCamelCase(newDoc.translationOf)) {
                errors.push({"translationOf" : "The translationOf field must be in lowerCamelCase."});
            }
        }
        else {
            // if the record type is not a TRANSLATION, the translationOf field is not allowed
            if (newDoc.translationOf) {
                errors.push({"translationOf" : "The translationOf field is only allowed for aliases."});
            }
        }

        // if the record type is ALIAS or ALIASTRANSFORMATION, valueSpace is not allowed
        if (newDoc.valueSpace && newDoc.type && ( newDoc.type == "ALIAS" || newDoc.type == "ALIASTRANSFORMATION" )) {
            errors.push({"valueSpace" : "The valueSpace field not allowed for aliases or transformations."});
        }

        // if the record type is OPERATOR, a termLabel is not allowed
        if (newDoc.termLabel && newDoc.type && newDoc.type == "OPERATOR") {
            errors.push({"termLabel" : "The termLabel field not allowed for operators."});
        }

        // if the record type is not TRANSLATION or GENERAL, applicationUniqueFlag is not allowed
        if (newDoc.applicationUniqueField && newDoc.type && ( newDoc.type !== "TRANSLATION" && newDoc.type !== "GENERAL" )) {
            errors.push({"applicationUniqueField" : "The applicationUniqueField is only allowed for translations and terms."});
        }
        // If the record type is OPERATOR, the uses field is not allowed
        if (newDoc.uses && newDoc.type && newDoc.type == "OPERATOR") {
            errors.push({"uses" : "Operators are not allowed to have usage information."});
        }

        // If there are any validation errors, throw them all at once for validation
        if (errors.length > 0) {
            throw({ "forbidden" : {
                "summary":  "There were one or more errors with the data you submitted.  Please review.",
                "errors" :  errors,
                "current" : oldDoc,
                "new" :     newDoc
            }});
        }
    }
}

function isLowerCamelCase(string) {
    if (string.match(/^([a-z0-9]+(([0-9]|[A-Z])[a-z]*){0,})$/)) return true;

    return false;
}
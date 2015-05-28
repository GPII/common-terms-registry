// A common set of "filter" functions, which are meant to be required from your script and called using the full
// function name, i.e. `gpii.ptd.api.lib.filter`.  The function accepts both `includes` and `excludes` options, which
// are expected to be formatted as follows:
//
// {
//    includes: { fieldName: ["accepted", "alsoAccepted"] }
//    excludes: { otherFieldName: "notAccepted" }
// }
//
// Within the `includes` and `excludes` blocks, the hash key is expected to match a field name in the record that is
// being filtered.  You can associated each field with a single string value, or multiple string values in an array.
// All matches must be exact, and regular expressions are not currently supported.
//
// In the example above, the following records would match:
//   { fieldName: "accepted", otherFieldName: "neutral" }
//   { fieldName: "alsoAccepted", otherFieldName: "neutral" }
//
// Includes are implicitly ANDed, i.e. any match is enough to include a record.
//
// The following would not be accepted:
//   { fieldName: "accepted", otherFieldName: "notAccepted" }
//   { fieldName: "alsoAccepted", otherFieldName: "notAccepted" }
//
// Excludes are implicitly ORed, i.e. any match is enough to exclude a record.
//
// You can leave either option blank, and only the other will be applied.  If no options are entered, no filtering will
// be applied.
//
// In all cases, a (potentially modified) copy of the original is returned, and the original is not modified.
//
// The default comparison is an "equals" (===).  For other comparisons, an expanded syntax is needed, as in:
//
// { fieldName: { comparison: "ge", value: 1 } } // greater than or equal to
// { fieldName: { comparison: "gt", value: 1 } } // greater than
// { fieldName: { comparison: "le", value: 1 } } // less than or equal to
// { fieldName: { comparison: "lt", value: 1 } } // less than
// { fieldName: { comparison: "eq", value: 1 } } // equal (the default if `comparison` is omitted)
//
// The last example is exactly equivalent to the simpler syntax:
//
// { fieldName: 1 }

"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.lib.filter");

gpii.ptd.api.lib.filter.filter = function (array, filterDefinitions) {
    filterDefinitions = filterDefinitions ? filterDefinitions : {};

    if (!Array.isArray(array)) {
        fluid.fail("Cannot filter anything but an array");
    }

    var processedArray = fluid.copy(array);
    if (filterDefinitions.includes) {
        fluid.remove_if(processedArray, function (record) {
            return !gpii.ptd.api.lib.filter.matchesAllOptions(record, filterDefinitions.includes);
        });
    }
    if (filterDefinitions.excludes) {
        fluid.remove_if(processedArray, function (record) {
            return gpii.ptd.api.lib.filter.matchesAnyOptions(record, filterDefinitions.excludes);
        });
    }
    return processedArray;
};


gpii.ptd.api.lib.filter.matchesAnyOptions = function (record, matchingFilterDefinitions) {
    // If there are no options to match, return true
    if (!matchingFilterDefinitions || Object.keys(matchingFilterDefinitions).length === 0) {
        return true;
    }

    var optionMatches = gpii.ptd.api.lib.filter.getOptionMatches(record, matchingFilterDefinitions);

    for (var a = 0; a < optionMatches.length; a++) {
        if (optionMatches[a]) {
            return true;
        }
    }

    return false;
};

gpii.ptd.api.lib.filter.matchesAllOptions = function (record, matchingFilterDefinitions) {
    var optionMatches = gpii.ptd.api.lib.filter.getOptionMatches(record, matchingFilterDefinitions);

    for (var a = 0; a < optionMatches.length; a++) {
        if (!optionMatches[a]) {
            return false;
        }
    }

    return true;
};

// Test all filter definitions against the current record and return an array containing the results.
gpii.ptd.api.lib.filter.getOptionMatches = function (record, matchingFilterDefinitions) {
    var optionMatches = [];

    var validComparisons = ["eq", "ge", "gt", "le", "lt"];

    fluid.each(matchingFilterDefinitions, function (filterDefinition, field) {
        var recordMatches = false;

        // We only compare to defined values.  This means that you can not exclude or include by null or undefined values.
        if (record[field]) {
            var isSimple   = typeof filterDefinition === "string" || Array.isArray(filterDefinition);
            var comparison = isSimple ? "eq" : (filterDefinition.comparison ? filterDefinition.comparison : "eq");

            if (validComparisons.indexOf(comparison) === -1) {
                fluid.fail("Cannot filter records because you have specified an invalid type of comparison");
            }

            var compareTo  = isSimple ? filterDefinition : filterDefinition.value;
            var fieldValue = record[field];

            // Most types of fields "just work", but dates are stored as strings and not delivered to us as dates that can be used in comparisons.
            if (!isSimple && filterDefinition.type === "date") {
                fieldValue = new Date(fieldValue);
            }

            if (Array.isArray(compareTo)) {
                fluid.each(compareTo, function (compareValueWithinArray) {
                    if (gpii.ptd.api.lib.filter.testSingleMatch(comparison, fieldValue, compareValueWithinArray)) {
                        recordMatches = true;
                    }
                });
            }
            else {
                if (gpii.ptd.api.lib.filter.testSingleMatch(comparison, fieldValue, compareTo)) {
                    recordMatches = true;
                }
            }
        }

        optionMatches.push(recordMatches);
    });

    return optionMatches;
};

gpii.ptd.api.lib.filter.testSingleMatch = function (comparison, left, right) {
    return (
            (comparison === "eq" && left === right) ||
            (comparison === "le" && left <=  right) ||
            (comparison === "lt" && left <   right) ||
            (comparison === "ge" && left >=  right) ||
            (comparison === "gt" && left >   right)
    );
};
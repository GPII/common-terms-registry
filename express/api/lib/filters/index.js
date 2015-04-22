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

gpii.ptd.api.lib.filter.filter = function (array, options) {
    options = options ? options : {};

    if (!Array.isArray(array)) {
        fluid.fail("Cannot filter anything but an array");
    }

    var processedArray = fluid.copy(array);
    if (options.includes) {
        fluid.remove_if(processedArray, function (record) {
            return !gpii.ptd.api.lib.filter.matchesOptions(record, options.includes);
        });
    }
    if (options.excludes) {
        fluid.remove_if(processedArray, function (record) {
            return gpii.ptd.api.lib.filter.matchesOptions(record, options.excludes);
        });
    }
    return processedArray;
};

gpii.ptd.api.lib.filter.matchesOptions = function (record, options) {
    var recordMatches = false;

    var validComparisons = ["eq", "ge", "gt", "le", "lt"];

    fluid.each(options, function (value, key) {
        // We only compare to positive values.  This means that you can not exclude or include by null or undefined values.
        if (record[key]) {
            var isSimple   = typeof value === "string";
            var comparison = isSimple ? "eq" : (value.comparison ? value.comparison : "eq");

            if (validComparisons.indexOf(comparison) === -1) {
                fluid.fail("Cannot filter records because you have specified an invalid type of comparison");
            }

            var compareTo  = isSimple ? value : value.value;
            if ((comparison === "eq" && record[key] === compareTo) ||
                (comparison === "le" && record[key] <=  compareTo) ||
                (comparison === "lt" && record[key] <   compareTo) ||
                (comparison === "ge" && record[key] >=  compareTo) ||
                (comparison === "gt" && record[key] >   compareTo)) {
                recordMatches = true;
            }
        }
    });

    return recordMatches;
};
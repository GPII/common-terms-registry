// This is a placeholder for a new common "filter" module that accepts both `includes` and `excludes` options, which are
// expected to be as follows:
//
// {
//    includes: { fieldName: ["accepted", "alsoAccepted"] }
//    excludes: { otherFieldName: "notAccepted" }
// }
//
// The hash key is expected to match a field name in the record that is being filtered.
// You can associated each field with a single string value, or multiple string values in an array.
// All matches must be exact, and regular expressions are not currently supported.
//
// In the example above, the following records would match:
//   { fieldName: "accepted", otherFieldName: "neutral" }
//   { fieldName: "alsoAccepted", otherFieldName: "neutral" }
//
// The following would not be accepted:
//   { fieldName: "accepted", otherFieldName: "notAccepted" }
//   { fieldName: "alsoAccepted", otherFieldName: "notAccepted" }
//
// You can leave either option blank, and only the other will be applied.
//
// If no options are entered, no filtering will be applied.
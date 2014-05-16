# Common Terms Registry API
The Common Terms Registry API is a tool to allow developers to find and reuse common terms that describe user needs and preferences, and to contribute new standard terms and aliases not already included in the Common Terms Registry.

This document describes the REST API available to developers.

# Data Objects
This section describes the data objects which are accepted by and returned by the Common Terms Registry API.

## Record
All records in the Common Terms Registry have the following common fields:

|Field|Description|
| --- | --- |
|Type|The type of record, i.e. term, alias, translation, transformation, operator.|
|Permanency|An indication of how likely a field is to change over time.|
|NameSpace|The namespace to use in combination with the UniqueID to construct a URI that refers to the record.|
|UniqueId|A completely unique identifier for this record.|
|Notes|Any additional information associated with this record.|
|Status|The review status of this record.|
|Updated|The date at which the record was last updated.|

## Term
A term is a single canonical way of describing a need or solution. For example, users who require high-contrast schemes may be concerned about the ability to set a high-contrast background and foreground color. Each of these would be a common term, identified by a persistent ID such as backgroundColor or foregroundColor.  In addition to the common fields described above, term records have the following fields:

|Field|Description|
| --- | --- |
|ValueSpace|A description of the values allowed for this term.|
|TermLabel|A short label for this term as it would appear in a menu or listing.|
|Definition|A description of the term.|
|ApplicationUniqueFlag|Whether this term is unique to a particular application.|
|Uses|A description of other systems that use this term and how they use it.|

## Alias
An alias is another name for a standard term, with no other differences. When describing system settings and other user preferences, the difference may be simply a matter of formatting. For example, one program might have a registry entry or setting for max.volume and another might have a registry entry or setting called max_volume. Other examples may simply be a matter of alternate wording. For example, one developer may use “loudness” instead of “volume” when describing their settings. In addition to the common fields described above, alias records have the following fields:

|Field|Description|
| --- | --- |
|AliasOf|The unique identifier of the parent record this record is an alias of.|
|TermLabel|A short label for this term as it would appear in a menu or listing.|
|Uses|A description of other systems that use this term and how they use it.|

## Translation
A translation is representation of a term in another language with no other differences. For example, in US English, the preference for a particular background color might be presented as “backgroundColor”. In Commonwealth countries, that might be presented as “backgroundColour”. In addition to the common fields described above, translation records have the following fields:

|Field|Description|
| --- | --- |
|TranslationOf|The unique identifier of the parent record this record is a translation of.|
|ValueSpace|A translation of the terms used in the parent record’s value space.|
|TermLabel|A translation of the short label for the parent record as it would appear in a menu or listing.|
|Definition|A translation of the definition of the parent record.|
|Uses|A description of other systems that use this term and how they use it.|

## Transformation
Translations and aliases present a term using different words or formatting, with no meaningful difference in the values used to describe a user’s needs or preferences. For example, two devices may have a volume control that can be set from 0 to 10 in increments of 1. If those two devices have the same maximum volume and each of their corresponding volume levels are the same loudness, then a user who prefers (or requires) for the volume to be set to 10 would have the same experience in having that preference applied to each device. It wouldn't matter if one device called the control “volume” and the other called the control “loudness”. On the other hand, if two devices have a different maximum volume, are adjustable using different increments, or have a different perceived loudness when set to the same value, then something else is required.

For these cases, the Common Terms Registry provides a transformation. A transformation provides a bidirectional lossless algorithm for converting from one way of describing preferences and needs to another. To continue the previous example, the common term describing volume preferences might be expressed using a decibel scale. For an implementation that uses 0-10 to indicate volume, the transformation record would provide an algorithm for converting from decibel to 0-10 values and from 0-10 values to decibel values. In addition to the common fields described above, transformation records have the following fields:

|Field|Description|
| --- | --- |
|AliasOf|The unique identifier of the parent record this record is a transformation alias of.|
|ValueSpace|A bidirectional lossless algorithm for converting to and from the values used by the common term.|
|TermLabel|A translation of the short label for the parent record as it would appear in a menu or listing.|
|Uses|A description of other systems that use this term and how they use it.|

## Operator
There are some preferences that are conditional, and depend on the environment and the content an AT user is interacting with. For example, an AT user may wish to have two different color schemes, one for daylight hours, and one for nighttime.

Operators are terms that can be used to clearly identify what settings should be applied under what circumstances.  For example, “greater than”, “less than”, and “in the following range” are all operators. The conjunctions “and”, “or” as well as the adverbs “not” and “only” are also operators. Operators can be combined to describe complex conditions.

In addition to the common fields described above, operator records have only one additional field.

|Field|Description|
| --- | --- |
|Definition|A clear definition of the operator.|

## Relationships
Terms and Operators are unique records that do not refer to another record implicitly. All other record types (aliases, translations, transformations) must refer to a single parent term (see the aliasOf, translationOf, etc. fields proposed above).

## Change Sets
Updates to existing records are moderated in the Common Terms Registry.  To manage multiple proposed updates to the same set of records, we use a change set that consists of only the differences between the proposed new record and the existing record.  A change set contains the following information.

|Field|Description|
| --- | --- |
|ChangeId|A completely unique identifier for this change set.|
|UniqueId|The unique identifier of the record to be updated.|
|Changes|The JSON data that represents the proposed changes.  Fields to be deleted are included and set to `null`.|
|Created|The date at which the change was proposed.|
|Status| Whether the change set was approved, rejected, or is still under review.  Can be set to "unreviewed", "approved", or "rejected".|
|Reviewed| The date at which the change was approved or rejected.  Undefined if the change set has not already been reviewed.|
|Author|The user proposing the changes.|
|Reviewer|The user approving or rejecting the changes.  Undefined if the change set has not already been reviewed.|

# API REST endpoints

## POST /api/record
Creates a new record.  If an author is supplied, gives them credit, otherwise the current user is listed as the author.

+ Request (application/json}

    ```
    {
       "type": "GENERAL",
       "uniqueId": "newRecord",
       "termLabel": "New Record",
       "definition": "This is a new record.",
       "notes": "This record was created as an example.",
        "lastUpdated": "Wed Apr 09 2014 13:30:00 GMT+0200 (CEST)"
     }
     ```

+ Response 200 (application/json)
    + Body

        ```
        {
            "ok":true,
            "message":"New record submitted."
            "record": {
               "type": "GENERAL",
               "uniqueId": "newRecord",
               "termLabel": "New Record",
               "definition": "This is a new record.",
               "notes": "This record was created as an example.",
               "lastUpdated": "Wed Apr 09 2014 13:30:00 GMT+0200 (CEST)"
            }
        }
        ```

## PUT /api/record
Update an existing record.  If an author is supplied, gives them credit, otherwise the current user is listed as the author.  Partial records are allowed, but at a minimum you must provide a uniqueId and at least one other field.  If a partial record is submitted, only the supplied fields will be updated.  To clear the value for a field, you must explicitly pass "null" as the value.  Returns the updated record.

+ Request (application/json}

    ```
    {
       "uniqueId": "existingRecord",
       "definition": "This existing record needs to be updated.",
       "notes": null
     }
    ```

+ Response 200 (application/json)
    + Body

        ```
        {
            "ok":true,
            "message":"Record updated."
            "record": {
                "uniqueId": "existingRecord",
                "definition": "This existing record needs to be updated.",
                "type": "GENERAL",
                "termLabel": "Existing Record",
                "definition": "This is an existing record.",
                "notes": "This record is another sample record.",
                "lastUpdated": "Wed Apr 09 2014 13:30:00 GMT+0200 (CEST)"
            }
        }
        ```

## DELETE /api/record/{uniqueId}{?confirm}
Flags a record as deleted.  If an author is supplied, gives them credit, otherwise the current user is listed as the author.

+ Parameters
    + uniqueId (required, string) ... The unique identifier of a single record.

+ Response 200 (application/json)

    ```
    {
        "ok": true,
        "message": "Record flagged as deleted."
    }
    ```

## GET /api/record/{uniqueId}
Returns a single record identified by its uniqueId.

+ Response 200 (application/json)

    + Body

        ```
        {
            "ok": true,
            "record": {
                "type": "ALIAS",
                "uniqueId": "org.gnome.settings-daemon.plugins.sound.active",
                "aliasOf": "soundActive",
                "notes": "The original alias record contained the following additional information:\r\n\r\ndefaultValue:TRUE\r\nuserPreference:org.gnome.settings-daemon.plugins.sound.active\r\nvalueSpace:Boolean\r\nid:662\r\n",
                "termLabel": "org.gnome.settings-daemon.plugins.sound.active",
                "status": "active",
                "source": "gnome",
                "lastUpdated": "Wed Apr 09 2014 13:30:00 GMT+0200 (CEST)"
            },
            "retrievedAt": "Thu Apr 10 2014 13:38:59 GMT+0200 (CEST)"
        }
        ```

## GET /api/records/{?lastUpdated,recordType,offset,limit}
The full list of records.  Returns all record types by default.

+ Parameters
    + lastUpdated (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only records updated at or after this time are returned.
    + recordType (optional, string) ... The type of records to return.  Supported values are ("term","alias","transform","translation", and "operator").
    + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.

+ Response 200 (application/json)
    + Body

        ```
        {
            "ok": true,
            "total_rows": 1,
            "startpos": 0,
            "pagesize": 1,
            "records": [
                     {
                        "type": "ALIAS",
                        "uniqueId": "org.gnome.settings-daemon.plugins.sound.active",
                        "aliasOf": "soundActive",
                        "notes": "The original alias record contained the following additional information:\r\n\r\ndefaultValue:TRUE\r\nuserPreference:org.gnome.settings-daemon.plugins.sound.active\r\nvalueSpace:Boolean\r\nid:662\r\n",
                        "termLabel": "org.gnome.settings-daemon.plugins.sound.active",
                        "status": "active",
                        "source": "gnome"
                        "lastUpdated": "Wed Apr 09 2014 13:30:00 GMT+0200 (CEST)"
                    }
            ],
            "retrievedAt": "Thu Apr 10 2014 13:38:59 GMT+0200 (CEST)"
        }
        ```

## GET /api/terms/{?lastUpdated,offset,limit}
The list of standard terms. Equivalent to using /api/records with the query parameter `recordType=term`.  Supports the same query parameters as /api/records except for `recordType`.  Terms include all of their associated records, include aliases, transforms, and translations.

+ Parameters
    + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + lastUpdated (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only records updated at or after this time are returned.
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.

+ Response 200 (application/json)
    + Body

        ```
        {
            "ok": true,
            "total_rows": 1,
            "startpos": 0,
            "pagesize": 1,
            "records": [
                    {
                        "type": "GENERAL",
                        "uniqueId": "brailleGrade",
                        "valueSpace": "uncontracted, contracted",
                        "termLabel": "braille grade",
                        "definition": "grade of Braille to use when using a Braille display",
                        "status": "unreviewed",
                        "source": "gpii",
                        "aliases": [
                                {
                                    "type": "ALIAS",
                                    "uniqueId": "Input Braille Grade, output Braille Grade",
                                    "aliasOf": "brailleGrade",
                                    "notes": "The original alias record contained the following additional information:\n\ndefinition:Allow to select braille grade for braille input, Allow to select braille grade for braille output on braille display\nuserPreference:Input Braille Grade, output Braille Grade\nvalueSpace:Multiple options based on the grade supported with MA\ngroup:Braille,Everywhere\nid:25, 32\n",
                                    "termLabel": "Input Braille Grade, output Braille Grade",
                                    "status": "unreviewed",
                                    "source": "mobileAccessCf"
                                }
                        ]
                    }
            ],
            "retrievedAt": "Thu Apr 10 2014 13:38:59 GMT+0200 (CEST)"
        }
        ```

## GET /api/aliases/{?lastUpdated,offset,limit}
The list of aliases. Equivalent to using /api/records with the query parameter `recordType=alias`.  Supports the same query parameters as /api/records except for `recordType`.

+ Parameters
    + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + lastUpdated (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only records updated at or after this time are returned.
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.

+ Response 200 (application/json)
    + Body

        ```
        {
            "ok": true,
            "total_rows": 1,
            "startpos": 0,
            "pagesize": 1,
            "records": [
                     {
                        "type": "ALIAS",
                        "uniqueId": "org.gnome.settings-daemon.plugins.sound.active",
                        "aliasOf": "soundActive",
                        "notes": "The original alias record contained the following additional information:\r\n\r\ndefaultValue:TRUE\r\nuserPreference:org.gnome.settings-daemon.plugins.sound.active\r\nvalueSpace:Boolean\r\nid:662\r\n",
                        "termLabel": "org.gnome.settings-daemon.plugins.sound.active",
                        "status": "active",
                        "source": "gnome"
                        "lastUpdated": "Wed Apr 09 2014 13:30:00 GMT+0200 (CEST)"
                    }
            ],
            "retrievedAt": "Thu Apr 10 2014 13:38:59 GMT+0200 (CEST)"
        }
        ```

## GET /api/transforms/{?lastUpdated,offset,limit}
The list of transforms. Equivalent to using /api/records with the query parameter `recordType=transform`.  Supports the same query parameters as /api/records except for `recordType`.

+ Parameters
    + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + lastUpdated (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only records updated at or after this time are returned.
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.

## GET /api/translations/{?lastUpdated,offset,limit}
The list of translations. Equivalent to using /api/records with the query parameter `recordType=translation`.  Supports the same query parameters as /api/records except for `recordType`.

+ Parameters
    + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + lastUpdated (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only records updated at or after this time are returned.
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.

## GET /api/operators/{?lastUpdated,offset,limit}
The list of operators.  Equivalent to using /api/records with the query parameter `recordType=operator`.  Supports the same query parameters as /api/records except for `recordType`.

+ Parameters
    + status (optional, string) ... The record statuses to return (defaults to everything but 'deleted' records).  Can be repeated to include multiple statuses.
    + lastUpdated (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only records updated at or after this time are returned.
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.

## GET /api/search/{?q,sort,offset,limit}
Performs a full text search of all data, returns matching terms.  Only standard terms are returned.  All other associated record types are combined with the standard term into a single record.

+ Parameters
    + q (required, string) ... The query string to match.  Can either consist of a word or phrase as plain text, or can use [lucene's query syntax][1] to construct more complex searches.
    + sort (optional,string) ... The sort order to use when displaying records.  Conforms to [lucene's query syntax][1].
    + offset (optional, string) ... The number of records to skip in the list of results.  Used for pagination.
    + limit (optional, string) ... The number of records to return.  Used for pagination.

+ Response 200 (application/json)
    + Body

        ```
        {
            "ok": true,
            "total_rows": 1,
            "startpos": 0,
            "pagesize": 1,
            "q": "soundActive",
            "sort": "uniqueId ASC",
            "records": [
                {
                    "type": "GENERAL",
                    "uniqueId": "6DotComputerBrailleTable",
                    "definition": "Allow selection of 6 dot computer braille",
                    "status": "unreviewed",
                    "source": "gpii",
                    "aliases": [
                        {
                            "type": "ALIAS",
                            "uniqueId": "6 dot computer braille table",
                            "aliasOf": "6DotComputerBrailleTable",
                            "termLabel": "6 dot computer braille table",
                            "notes": "The original alias record contained the following additional information:\n\ndefinition:Allow selection of 6 dot computer braille\nuserPreference:6 dot computer braille table\nvalueSpace:Multiple options based on the grade supported with MA\ngroup:Braille,Everywhere\nid:3\n",
                            "status": "unreviewed",
                            "source": "mobileAccessCf"
                            "lastUpdated": "Wed Apr 09 2014 13:30:00 GMT+0200 (CEST)"
                        }
                    ],
                    "lastUpdated": "Wed Apr 02 2014 13:30:00 GMT+0200 (CEST)"
                }
            ],
            "retrievedAt": "Thu Apr 10 2014 13:38:59 GMT+0200 (CEST)"
        }
        ```

## GET /api/suggest/{?q,sort}
Suggest the correct common term to use.  Performs a search as in /api/search, but only returns 5 results and does not support paging.  Equivalent to `/api/suggest?q=search&results=5`.

+ Parameters
    + q (required, string) ... The query string to match.  Can either consist of a word or phrase as plain text, or can use [lucene's query syntax][1] to construct more complex searches.
    + sort (optional,string) ... The sort order to use when displaying records.  Conforms to [lucene's query syntax][1].

+ Response 200 (application/json)
    + Body

        ```
        {
            "ok": true,
            "total_rows": 1,
            "startpos": 0,
            "pagesize": 1,
            "q": "soundActive",
            "sort": "uniqueId ASC",
            "records": [
                {
                    "type": "GENERAL",
                    "uniqueId": "6DotComputerBrailleTable",
                    "definition": "Allow selection of 6 dot computer braille",
                    "status": "unreviewed",
                    "source": "gpii",
                    "aliases": [
                        {
                            "type": "ALIAS",
                            "uniqueId": "6 dot computer braille table",
                            "aliasOf": "6DotComputerBrailleTable",
                            "termLabel": "6 dot computer braille table",
                            "notes": "The original alias record contained the following additional information:\n\ndefinition:Allow selection of 6 dot computer braille\nuserPreference:6 dot computer braille table\nvalueSpace:Multiple options based on the grade supported with MA\ngroup:Braille,Everywhere\nid:3\n",
                            "status": "unreviewed",
                            "source": "mobileAccessCf"
                            "lastUpdated": "Wed Apr 09 2014 13:30:00 GMT+0200 (CEST)"
                        }
                    ],
                    "lastUpdated": "Wed Apr 02 2014 13:30:00 GMT+0200 (CEST)"
                }
            ],
            "retrievedAt": "Thu Apr 10 2014 13:38:59 GMT+0200 (CEST)"
        }
        ```

[1] https://github.com/rnewson/couchdb-lucene   "Lucene-couchdb documentation"
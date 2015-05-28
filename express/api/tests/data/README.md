The test data stored here was generated using a command like the following

    curl http://localhost:5984/tr/_all_docs?include_docs=true | json_pp > data.json

For the initial data, design documents were manually removed from the data, and the _all_docs format was manually updated to resemble the format required by _bulk_update.  This mainly involved extracting just the "value" attribute from each row.
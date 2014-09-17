This directory contains the [JSON Schemas](http://json-schema.org/) used by the Preference Terms Dictionary, as well as a convenience library for working with schemas from within express.

JSON schemas are used for server-side validation and feeding back meaningful error messages regarding invalid or incomplete data.

All messages returned by the APIs (with the exception of the third-party user management API) are also formatted to comply with their own JSON schemas as well, which are included in the header information sent to the client.

The "schemas" directory is meant to be exposed to end users using the [express.static middleware](https://github.com/expressjs/serve-static).  Third-party validation tools attempting to look up the original schemas will need for these to be publicly accessible.
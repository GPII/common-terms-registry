The contents of this directory are meant to be pushed to a couchdb instance and hosted from there.

All code follows the "couchapp" conventions and is meant to be deployed with that tool:

https://github.com/couchapp/couchapp

There are currently three separate couchapps, all of of which can be safely deployed to the same Couchdb instance
and database.

1. The "api" directory contains the views, etc. required to support the Preference Terms Dictionary API.
2. The "lucene" directory contains the views, etc. required for lucene integration.
3. The "app" directory contains the older application and a few key views.  This will be deprecated shortly.

Consult the README.md files in the child directories for more information about a specific couchapp.
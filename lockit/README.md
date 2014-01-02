This directory contains the lockit server (an express.js app) which manages user signup, verification, and password resets for the Common Terms Registry.

Before getting started, you will need to:

1. Create the user database ("u") on your couchdb instance.
2. Edit the sample configuration in node_modules/lockit/node_modules/lockit-couchdb-adapter/test/config.js to set the correct db settings.
3. Populate the user database with the required views by running "node createViews" from the node_modules/lockit/node_modules/lockit-couchdb-adapter directory.
4. Set up the proxy rules for the new server by adding the following to your couchdb httpd_global_handlers configuration:
       _l = {couch_httpd_proxy, handle_proxy_req, "http://localhost:3000"}

Once you've done all of this, start the server using the following command:

     node app.js

You will need to do this before you can log in to the terms registry, which does not work with couchdb accounts or sessions.
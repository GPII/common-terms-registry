This directory contains the express.js instance used by the Common Terms Registry, which includes all public REST apis, and static web pages.

Before you can start this instance of express, you will need to add a view to your couchdb's _user database using a command like:

       node ./node_modules/express-user-couchdb/init http://admin:admin@localhost:5984/_users

Start the server using the following command:

     node app.js

Once that's done, connect to the server using a URL like:

     http://localhost:4895/
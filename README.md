The terms registry is intended to help people describing needs and solutions translate between the range of terms used to describe both.  

The registry consists of canonical entries and aliases from other namespaces.

To set up a development instance of the registry, you will need:

* couchdb
* node.js
* the couchapp python script (from couchapp.org)

Once you have those, you will need to get the full data set.  You can either do this by:

# Replicating from another instance:  http://wiki.apache.org/couchdb/Replication
# Building the data set from the source materials using the contents of the scripts folder (see that folder for instructions).

Once you have data, you would deploy the contents of the couchapp directory to set up the administrative interface.  See the "couchapp" folder
for instructions. 

This directory contains files that are used to import the contents of the previous shared spreadsheet into the Preference Terms Dictionary, found at:

http://bit.ly/17LIFMB

That file contains records in which the GPII/Cloud4All PTD entries are the first set of columns, and additional namespaces appear on the same rows.

Before importing, the data needs to be updated to replace the column headings with the contents of the header.txt file included in this directory.

Once that change is made, run the import.js script in the source directory.  Running the command with no arguments displays the full instructions:
     node import.js
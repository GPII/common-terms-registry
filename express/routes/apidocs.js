module.exports = function(req, res){
    var fs = require('fs');
    var apiSource = "";
    var apiData = {};

    fs.readFile('/Users/duhrer/Source/rtf/rtf-terms-registry/express/api/ctr.md', function(err,data) {
	    if (err) {
            console.log(err);
            return;
	    }
	    apiSource = data;

	    var protagonist = require('protagonist');
	    protagonist.parse(apiSource.toString(), function(error, result) {
		    if (error) {
                console.log(error);
                return;
		    }
            apiData = result.ast;
            res.render('apidocs', { title: 'Common Terms Registry API Documentation', "apiData": JSON.stringify(apiData, null, "\t"), "apiSource": apiSource });
		});
	    
	});
};
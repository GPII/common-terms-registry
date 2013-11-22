$(function() {   
    // load all Mustache templates
    $.get('templates/terms.mustache', function(templates) { $(templates).each(function() { $('body').append(this); }); });
    
    /* jslint -W117 */
	$("#account").couchLogin({
		loggedIn : function(r) {
//		    $("#profile").couchProfile(r, {});
            wireUpTable();
        },
        loggedOut : function() {
                $("#profile").html('<p>Please log in to see your profile.</p>');
                $("#content").html("You must log in to view the registry.");
		}
    });
        
    function wireUpTable() {
	    $("#content").jtable({
		    title: 'Terms Registry',
            paging: true,
            // By default jTable uses a POST for everything, which doesn't work when couchdb expects a GET (lists, views, shows)
            // TODO:  Figure out how to do this for just the listAction
            ajaxSettings: {
                type: 'GET'
            },
			actions: { 
                listAction: '/tr/_design/trapp/_list/jtable/terms'
             },
			fields: {
                id:
                {
                    key: true,
                    list: false
				},
                type: {
                    title: 'Record Type',
                    list: false
                },
                uniqueId: {
                    title: 'Unique ID'
                },
                localUniqueId: {
                    title: 'Local Unique ID',
                    list: false
                },
                defaultValue: {
                    title: 'Values',
                    display: function(record) { return $.mustache($("#value").html(),record.record);}
                },
                definition: {
                    title: 'Definition / Notes',
                    sorting: false,
                    edit: false,
                    create: false,
                    display: function(record) { return $.mustache($("#definition").html(),record.record);}
                },
                aliases: {
                    title: 'Aliases',
                    sorting: false,
                    edit: false,
                    create: false,
                    display: function(record) {
                        return $.mustache($("#aliases").html(),record.record) + (record.record.aliases !== undefined ? $.mustache($("#compare-link").html(),record.record._id) : '') + $.mustache($("#compare").html(),record.record);
                    }
                },
                action: {
                    title: 'Actions',
                    edit: false,
                    create: false,
                    display: function(record) { return $.mustache($("#action").html(),record.record); }
                }
		    },
		});
        $("#content").jtable('load');
	}
 });
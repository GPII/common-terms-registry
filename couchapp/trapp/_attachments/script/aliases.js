$(function() {   
	$("#account").couchLogin({
		loggedIn : function(r) {
		    $("#profile").couchProfile(r, {});
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
                listAction: '/tr/_design/trapp/_list/jtable/aliases'
             },
			fields: {
                id:
                {
                    key: true,
                    list: false
				},
                recordType: {
                    title: 'Record Type',
                    list: false
                },
                userPreference: {
                    title: 'User Preference',
                },
                aliasTranslationOf: {
                    title: 'Alias Of',
                    edit: false,
                    create: false,
                    display: function(record) {
                        var $link = $('<a href="/_utils/document.html?tr/' + record.record.aliasTranslationOf + '">Show GPII Entry</a>');

                        return $link;
                    }                    
                },  
                localUniqueId: {
                    title: 'Local Unique ID',
                    list: false
                },
                defaultValue: {
                    title: 'Default Value',
                    sorting: false
                },
                groups: {
                    title: 'Groups',
                    sorting: false
                },
                ids: {
                    title: 'Ids',
                    sorting: false
                },
                description: {
                    title: 'Description / Notes',
                    sorting: false,
                    edit: false,
                    create: false,
                    display: function(record) {
                        var rawHtml = '<!-- ' + JSON.stringify(record.record) + '-->\n';
                        if (record.record.description != null && record.record.description != undefined) {
                            rawHtml += '<p class="description">' + record.record.description + '</p>';
                        }
                        if (record.record.notes != null && record.record.notes != undefined) {
                            rawHtml += '<p class="notes">' + record.record.notes + '</p>';
                        }
                        return $(rawHtml);
                    }
                },
                action: {
                    title: 'Actions',
                    width: '5%',
                    edit: false,
                    create: false,
                    display: function(record) {
                        var $link = $('<a href="/_utils/document.html?tr/' + record.record.id + '">View/Edit</a>');

                        return $link;
                    }
                }
		    },
		});
        $("#content").jtable('load');
	}

	// TODO:  Wire up pagination

	// TODO:  Wire up the list of aliases

	// TODO:  Wire up the add button

	// TODO:  Wire the delete button

	// TODO:  Create a basic view for terms and aliases

	// TODO:  Wire up jTable with actual data
 });
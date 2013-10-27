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
        
    // TODO:  Convert to common method for all alias-based views....
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
                        var $link = $('<span>' + record.record.aliasTranslationOf + '<br/><a href="/tr/_design/trapp/_view/terms?key=&quot;' +  record.record.aliasTranslationOf + '&quot;">View Parent</a></span>');

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
                        var rawHtml = '';
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
 });
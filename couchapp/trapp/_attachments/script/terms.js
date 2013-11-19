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
        
    // TODO:  Convert to common method for all term-based views....
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
                    title: 'Suggested Default Value',
                },
                definition: {
                    title: 'Definition / Notes',
                    sorting: false,
                    edit: false,
                    create: false,
                    display: function(record) {
                        var rawHtml = '<!-- ' + JSON.stringify(record.record) + '-->\n';
                        if (record.record.definition != null && record.record.definition != undefined) {
                            rawHtml += '<p class="definition">' + record.record.definition + '</p>';
                        }
                        if (record.record.notes != null && record.record.notes != undefined) {
                            rawHtml += '<p class="notes">' + record.record.notes + '</p>';
                        }
                        if (record.record.uses != null && record.record.uses != undefined) {
                            rawHtml += '<p class="notes">USES: <br/>' + record.record.uses + '</p>';
                        }

                        return $(rawHtml);
                    }
                },
                aliases: {
                    title: 'Aliases',
                    sorting: false,
                    edit: false,
                    create: false,
                    display: function(record) {
                        var html = "";
                        
                        if (record.record.aliases !== undefined && record.record.aliases.length >= 0) {
                            html += "<ul>\n";
                            
                            for (var rowNumber in record.record.aliases) {
                                html += '<li><a href="/_utils/document.html?tr/' + record.record.aliases[rowNumber].value._id + '">'    + record.record.aliases[rowNumber].value.uniqueId + "</a></li>\n";
                            }
                            
                            html += "</ul>\n";
                        }
                        
                        // 
                        
                        return $(html);
                    }
                },
                action: {
                    title: 'Actions',
                    edit: false,
                    create: false,
                    display: function(record) {
                        var $link = $('<a href="/_utils/document.html?tr/' + record.record._id + '">View/Edit</a><br/>');
                        return $link;
                    }
                }
		    },
		});
        $("#content").jtable('load');
	}
 });
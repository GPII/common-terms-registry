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
                localId: {
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
                        // Because of limitations of list handling in mustache, we have to create the container and process rows individually
                        var container = $("<div></div>");
                        var aliasContainer = $($.mustache($("#aliases").html(),record.record));
                        container.append(aliasContainer);

                        if (record.record.aliases !== undefined && record.record.aliases.length > 0) {
                            var compareContainer = $($.mustache($("#compare").html(),record.record));
                            container.append(compareContainer);

                            for (var position in record.record.aliases) {
                                aliasRecord = record.record.aliases[position];
                                aliasContainer.append($.mustache($("#alias-list-entry").html(),aliasRecord.value));

                                compareContainer.append($.mustache($("#compare-item").html(),aliasRecord.value));
                            }

                            container.append($.mustache($("#compare-link").html(),record.record));
                        }

                        return container;
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
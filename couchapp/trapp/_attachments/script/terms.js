$(function() {   
    // load all Mustache templates
    $.get('templates/terms.mustache', function(templates) { $(templates).each(function() { $('body').append(this); }); }).then(loadFooterAndHeader);

    $.couchProfile.templates = {
        profileReady : '<div class="avatar">{{#gravatar_url}}<img src="{{gravatar_url}}"/>{{/gravatar_url}}<div class="name">{{nickname}}</div></div><div style="clear:left;"></div>',
        newProfile : '<form><p>Hello {{name}}, Please setup your user profile.</p><label for="nickname">Nickname <input type="text" name="nickname" value=""></label><label for="email">Email (<em>for <a href="http://gravatar.com">Gravatar</a></em>) <input type="text" name="email" value=""></label><label for="url">URL <input type="text" name="url" value=""></label><input type="submit" value="Go &rarr;"><input type="hidden" name="userCtxName" value="{{name}}" id="userCtxName"></form>'
    };

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
                    title: 'Unique ID',
                    width: "15%"
                },
                termLabel: {
                    title: 'Label',
                    width: "15%"
                },
                localId: {
                    title: 'Local Unique ID',
                    list: false
                },
                defaultValue: {
                    title: 'Value Space',
                    width: "20%",
                    display: function(record) { return $.mustache($("#value").html(),record.record);}
                },
                definition: {
                    title: 'Definition / Notes',
                    width: "20%",
                    sorting: false,
                    edit: false,
                    create: false,
                    display: function(record) { return $.mustache($("#definition").html(),record.record);}
                },
                aliases: {
                    title: 'Aliases',
                    width: "20%",
                    sorting: false,
                    edit: false,
                    create: false,
                    display: function(record) {
                        // Because of limitations of list handling in mustache, we have to create the container and process rows individually
                        var container = $("<div></div>");
                        var aliasContainer = $($.mustache($("#aliases").html(),record.record));
                        container.append(aliasContainer);

                        if (record.record.aliases !== undefined && record.record.aliases.length > 0) {
                            for (var position in record.record.aliases) {
                                aliasRecord = record.record.aliases[position];
                                aliasContainer.append($.mustache($("#alias-list-entry").html(),aliasRecord.value));
                            }
                        }

                        return container;
                    }
                },
                action: {
                    title: 'Actions',
                    width: "10%",
                    edit: false,
                    create: false,
                    display: function(record) { return $.mustache($("#action").html(),record.record); }
                }
		    }
		});
        $("#content").jtable('load');
	}

    function loadFooterAndHeader() {
        $("#footer").html($("#footer-template").html());
//    $("#footer").html($.mustache($("#footer-template").html()));
    $("#header").html($.mustache($("#header-template").html(),document));

        $("#account").couchLogin({
            loggedIn : function(r) {
		        $("#profile").couchProfile(r, {});
                wireUpTable();
                $("#content").show();
                $("#no-content").hide();
            },
            loggedOut : function() {
                $("#profile").html('<p>Please log in to see your profile.</p>');
                $("#content").hide();
                $("#no-content").show();
            }
        });
    }
 });
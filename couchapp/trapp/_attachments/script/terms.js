$(function() {   
    var valueTemplate = '{{#valueSpace}}<p class="valueSpace">{{valueSpace}}</p>{{/valueSpace}}{{#defaultValue}}<p class="defaultValue">Suggested Default: {{defaultValue}}</p>{{/defaultValue}}';
    
    var aliasesTemplate = '<ul>{{#aliases}}<li><a href="/_utils/document.html?tr/{{_id}}">{{uniqueId}}</a></li>{{/aliases}}</ul>';

    var definitionTemplate = '{{#definition}}<p class="definition">{{definition}}</p>{{/definition}}{{#notes}}<p class="notes">{{notes}}</p>{{/notes}}{{#uses}}<p class="notes">USES: <br/>{{uses}}</p>{{/uses}}';

    var actionTemplate = '<a href="/_utils/document.html?tr/{{_id}}">View/Edit</a><br/>';
        
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
                    display: function(record) {
                        return $.mustache(valueTemplate,record.record);
                    }

                },
                definition: {
                    title: 'Definition / Notes',
                    sorting: false,
                    edit: false,
                    create: false,
                    display: function(record) {
                        return $.mustache(definitionTemplate,record.record);
                    }
                },
                aliases: {
                    title: 'Aliases',
                    sorting: false,
                    edit: false,
                    create: false,
                    display: function(record) {
                        return $.mustache(aliasesTemplate,record.record);
                    }
                },
                action: {
                    title: 'Actions',
                    edit: false,
                    create: false,
                    display: function(record) {
                        return $.mustache(actionTemplate,record.record);
                    }
                }
		    },
		});
        $("#content").jtable('load');
	}
 });
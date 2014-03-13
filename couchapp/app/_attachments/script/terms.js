
// load all templates
$.get('templates/terms.html', function(templates) { $(templates).each(function() { $('body').append(this); }); }).then(loadFooterAndHeader);

var COOKIE_ID = "ctlPnlSettings";

var controlPanelSettings = {
    "type": "GENERAL",
    "status": "active",
    "onlyUnreviewed": false
};

// field schemes so that we can display different fields for different record types and statuses
var fieldSchemes = {};
fieldSchemes['base'] = {
    edit: {
        width: "5%",
        edit: false,
        create: false,
        sorting: false,
        display: function(record) { return Handlebars.compile($("#edit").html())(record.record); }
    },
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
    valueSpace: {
        title: 'Value Space',
        sorting: true,
        width: "20%",
        display: function(record) { return Handlebars.compile($("#value").html())(record.record);}
    },
    definition: {
        title: 'Definition',
        sorting: true,
        width: "15%",
        edit: false,
        create: false,
        display: function(record) { return Handlebars.compile($("#definition").html())(record.record);}
    },
    notes: {
        title: 'Notes',
        sorting: true,
        width: "3%",
        edit: false,
        create: false,
        display: function(record) { return Handlebars.compile($("#notes").html())(record.record);}
    },
    uses: {
        title: 'Uses',
        sorting: true,
        width: "3%",
        edit: false,
        create: false,
        display: function(record) { return Handlebars.compile($("#uses").html())(record.record);}
    },
    unreviewedComments: {
        title: 'Comments',
        sorting: true,
        width: "3%",
        edit: false,
        create: false,
        display: function(record) { return Handlebars.compile($("#unreviewedComments").html())(record.record);}
    },
    aliases: {
        title: 'Aliases',
        sorting: true,
        width: "15%",
        edit: false,
        create: false,
        display: function(record) { return $(Handlebars.compile($("#aliases").html())(record.record)); }
    },
    delete: {
        width: "5%",
        edit: false,
        create: false,
        sorting: false,
        display: function(record) {
            record.record.isDeleted = record.record.status && record.record.status === "deleted";
            return Handlebars.compile($("#delete").html())(record.record);
        }
    }
}

// TODO:  Convert to template
$.couchProfile.templates = {
    profileReady : '<div class="avatar">{{#gravatar_url}}<img src="{{gravatar_url}}"/>{{/gravatar_url}}<div class="name">{{nickname}}</div></div><div style="clear:left;"></div>',
    newProfile : '<form><p>Hello {{name}}, Please setup your user profile.</p><label for="nickname">Nickname <input type="text" name="nickname" value=""></label><label for="email">Email (<em>for <a href="http://gravatar.com">Gravatar</a></em>) <input type="text" name="email" value=""></label><label for="url">URL <input type="text" name="url" value=""></label><input type="submit" value="Go &rarr;"><input type="hidden" name="userCtxName" value="{{name}}" id="userCtxName"></form>'
};

function wireUpTable(scheme, status) {
    if (scheme === undefined) { scheme = 'base'; }
    if (status == undefined) { status = 'active'; }

    $("#content").jtable({
        paging: true,
        pageSize: 50,
        pageSizes: [50,100,250,500,1000,2500],
        sorting: true,
        defaultSorting: "uniqueId ASC",
        columnSelectable: false,
        // By default jTable uses a POST for everything, which doesn't work when couchdb expects a GET (lists, views, shows)
        ajaxSettings: {
            type: 'GET'
        },
        actions: {
            listAction: '/tr/_design/app/_list/jtable/entries'
         },
        fields: fieldSchemes[scheme]
    });

    loadTable();
}

function loadTable() {
    var tableOptions = {"displayStatus": controlPanelSettings.status, "displayType" : controlPanelSettings.type, "onlyUnreviewed": controlPanelSettings.onlyUnreviewed};
    var queryString = $("#queryString").val();

    if (queryString !== undefined && queryString.trim().length > 0) {
        tableOptions.q = queryString;
    }

    $("#content").jtable(
        'load',
        tableOptions,
        function() {
            $("a.glyphicon-file").tooltip();
            $("th.jtable-column-header-sortable").on('click',function() {
                // Tooltips are cleared on page sort.  This fixes that.
                // TODO: Find a way to bind to the sorting event so that we can do this more cleanly, or replace jTable with something friendlier.
                setTimeout(function(){
                    $("a.glyphicon-file").tooltip();
                },1000);
            })
        }
    );
}

function saveControlPanelSettings() {
    $.cookie(COOKIE_ID,JSON.stringify(controlPanelSettings));
}

function loadControlPanelSettings() {
    // Check to see if the cookie exists
    var cookie = $.cookie(COOKIE_ID);
    if (cookie !== undefined) {
       var cookieJson = JSON.parse(cookie);

       // TODO:  This whole thing is very brittle, depending on constant combination of markup, selectors, etc.  Convert to Backbone.js or something else sane.
       if (cookieJson.status !== undefined) {
           controlPanelSettings.status = cookieJson.status;
           $(".filter-toggle").addClass("disabled");
           $("#" + cookieJson.status.toLowerCase() + "-record-toggle").removeClass("disabled");
       }

       if (cookieJson.type !== undefined) {
           controlPanelSettings.type = cookieJson.type;
           $(".type-toggle").addClass("disabled");

           $("#" + cookieJson.type.toLowerCase() + "-type-toggle").removeClass("disabled");
       }

       if (cookieJson.onlyUnreviewed !== undefined) {
           controlPanelSettings.onlyUnreviewed = cookieJson.onlyUnreviewed;
           if (cookieJson.onlyUnreviewed === false) {
               $("#comments-toggle").addClass("disabled");
           }
           else {
               $("#comments-toggle").removeClass("disabled");
           }
       }
    }
}

function activateStatusFilter(id,status) {
    var toggle = $(id);
    if (toggle.hasClass("disabled")) {
        $(".filter-toggle").addClass("disabled");
        $(id).removeClass("disabled");

        controlPanelSettings.status = status;
        saveControlPanelSettings();

        loadTable();
    }
}

function activateTypeFilter(id,type) {
    var toggle = $(id);
    if (toggle.hasClass("disabled")) {
        $(".type-toggle").addClass("disabled");
        $(id).removeClass("disabled");

        controlPanelSettings.type = type;
        saveControlPanelSettings();

        loadTable();
    }
}

function activateCommentFilter(id) {
    var toggle = $(id);

    var onlyUnreviewed = false;
    if (toggle.hasClass("disabled")) {
        onlyUnreviewed = true;
    }
    toggle.toggleClass("disabled");

    controlPanelSettings.onlyUnreviewed = onlyUnreviewed;
    saveControlPanelSettings();

    loadTable();
}

function loadFooterAndHeader() {
    $("#header").html($("#header-template").html());
    $("#controls").html($("#controls-template").html());
    $("#footer").html($("#footer-template").html());

    $("#account").couchLogin({
        loggedIn : function(r) {
            var db = $.couch.db("_users");
            var userDocId = "org.couchdb.user:" + r.userCtx.name;
            db.openDoc(userDocId, {
                success : function(userDoc) {
                    if (userDoc.emailVerified) {
                        loadControlPanelSettings();

                        $("#profile").couchProfile(r, {});
                        $("#login-message").remove();
                        $("#controls").show();
                        $("#control-toggle").show();
                        $("#add-panel").show();
                        $("#control-toggle").click(function() { $("#controls").slideToggle(75); $("#control-toggle").toggleClass("glyphicon-collapse-down glyphicon-collapse-up") ; return false;});

                        $("#general-type-toggle").click(function() { activateTypeFilter("#general-type-toggle","GENERAL"); return false;});
                        $("#alias-type-toggle").click(function() { activateTypeFilter("#alias-type-toggle","ALIAS"); return false;});
                        $("#translation-type-toggle").click(function() { activateTypeFilter("#translation-type-toggle","TRANSLATION"); return false;});
                        $("#operator-type-toggle").click(function() { activateTypeFilter("#operator-type-toggle","OPERATOR"); return false;});

                        $("#comments-toggle").click(function() { activateCommentFilter("#comments-toggle"); return false;});

                        $("#unreviewed-record-toggle").click(function() { activateStatusFilter("#unreviewed-record-toggle","unreviewed"); return false;});
                        $("#candidate-record-toggle").click(function() { activateStatusFilter("#candidate-record-toggle","candidate"); return false;});
                        $("#live-record-toggle").click(function() { activateStatusFilter("#live-record-toggle","active"); return false;});
                        $("#deleted-record-toggle").click(function() { activateStatusFilter("#deleted-record-toggle","deleted"); return false;});

                        $("#queryString").on('change',function() { loadTable(); });

                        $("#create-record-link").on('click',loadEditDialog);

                        wireUpTable();
                    }
                    else {
                        $("#content").html($("#verification-message-template").html());
                        $("#controls").hide();
                        $("#control-toggle").hide();
                        $("#add-panel").hide();
                        $("#profile").html('');
                    }
                }
            });
        },
        loggedOut : function() {
            $("#content").html($("#login-message-template").html());
            $("#controls").hide();
            $("#add-panel").hide();
            $("#profile").html('');
        },
        error: function() {
            $("#content").html($("#login-error-template").html());
        }
    });
}

function loadEditDialog(id) {
    $("#dialog").html($("#loading-template").html());


    var iframe = $('<iframe src="_show/edit-dialog/' + id + '"></iframe>');
    $("#dialog-content").html(iframe);

    $("#dialog").dialog({
        modal: true,
        width: '90%',
        height: $(window).height() * 0.9,
        close: function() { loadTable();}
    });

    return false;
}

function loadDeleteDialog(id) {
    $("#delete-" + id + "-form .dialog-content").html($("#delete-template").html());
    $("#delete-" + id + "-form").dialog({
        modal: true,
        width: '50%',
        height: $(window).height() * 0.5,
        buttons: [
            { text: "Cancel", click: function() { $( this ).dialog( "close" ); }},
            {   text: "Trash This Record",
                click: function() {
                    var data = $("#delete-" + id + "-form").serialize();

                    $.ajax({
                        url: "/tr/_design/app/_update/edit/",
                        type: "POST",
                        data: data,
                        context: id,
                        success: function(results, status, jqXHR){
                            $("#delete-" + id + "-form .dialog-content").html("Trashed record.  Any administrator can recover it from the trash.").addClass("alert alert-success");
                            loadTable();
                            $("#delete-" + id + "-form").dialog("close");
                        },
                        error: function(jqXHR, status, errorString) {
                            // TODO:  Once we clean up records, it shouldn't come up, but we may need to unpack the errors in the response better.
                            $("#delete-" + id + "-form .dialog-content").html("Error moving record '" + this + "' to the trash: " + errorString).addClass("alert alert-danger");
                        }
                    });
                }
            }
        ]
    });
}

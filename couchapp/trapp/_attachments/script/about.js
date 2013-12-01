$(function() {   
    // load all Mustache templates
    $.get('templates/terms.mustache', function(templates) { $(templates).each(function() { $('body').append(this); }); }).then(loadFooterAndHeader);

    $.couchProfile.templates = {
        profileReady : '<div class="avatar">{{#gravatar_url}}<img src="{{gravatar_url}}"/>{{/gravatar_url}}<div class="name">{{nickname}}</div></div><div style="clear:left;"></div>',
        newProfile : '<form><p>Hello {{name}}, Please setup your user profile.</p><label for="nickname">Nickname <input type="text" name="nickname" value=""></label><label for="email">Email (<em>for <a href="http://gravatar.com">Gravatar</a></em>) <input type="text" name="email" value=""></label><label for="url">URL <input type="text" name="url" value=""></label><input type="submit" value="Go &rarr;"><input type="hidden" name="userCtxName" value="{{name}}" id="userCtxName"></form>'
    };

    function loadFooterAndHeader() {
        $("#footer").html($("#footer-template").html());
//    $("#footer").html($.mustache($("#footer-template").html()));
    $("#header").html($.mustache($("#header-template").html(),document));

        $("#account").couchLogin({
            loggedIn : function(r) {
		        $("#profile").couchProfile(r, {});
                wireUpTable();
            },
            loggedOut : function() {
                $("#profile").html('<p>Please log in to see your profile.</p>');
            }
        });
    }
 });
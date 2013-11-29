
// Declare dependencies
/*global demo:true, fluid, jQuery*/

// JSLint options
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var demo = demo || {};

(function ($, fluid) {
//    $("#account").couchLogin({
//        loggedIn : function(r) {
////		    $("#profile").couchProfile(r, {});
//            demo.initPager();
//        },
//        loggedOut : function() {
//            $("#profile").html('<p>Please log in to see your profile.</p>');
//            $("#content").html("You must log in to view the registry.");
//        }
//    });


    /**
     * Main demo initialization
     */
    demo.initPager = function () {
        var resources = {
            users: {
                href: "script/pager.json",
                options: {
                    dataType: "json"
                }
            }
        };

        function initPager(resourceSpecs) {

            var model = resourceSpecs.users.resourceText;
            var columnDefs = [
                {
                    key: "user-link",
                    valuebinding: "*.userDisplayName",
                    sortable: true
                },
                {
                    key: "user-email",
                    valuebinding: "*.userEmail",
                    sortable: true
                },
                {
                    key: "user-role",
                    valuebinding: "*.memberRole",
                    sortable: true
                },
                {
                    key: "user-comment",
                    valuebinding: "*.userComment",
                    sortable: false
                }
            ];

            demo.pager = fluid.pager(".demo-pager-container", {
                dataModel: model,
                model: {
                    pageSize: 10
                },
                dataOffset: "membership_collection",
                columnDefs: columnDefs,
                annotateColumnRange: "user-link",
                bodyRenderer: {
                    type: "fluid.pager.selfRender",
                    options: {
                        selectors: {
                            root: ".demo-pager-table-data"
                        },
                        renderOptions: {debugMode: false}
                    }
                },
                decorators: {
                    unsortableHeader: [
                        {
                            type: "attrs",
                            attributes: {
                                title: null
                            }
                        },
                        {
                            type: "addClass",
                            classes: "fl-pager-disabled"
                        }
                    ]
                }
            });
        }

        fluid.fetchResources(resources, initPager);

    };
})(jQuery, fluid);
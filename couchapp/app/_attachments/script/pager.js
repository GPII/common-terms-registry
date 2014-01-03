
// Declare dependencies
/*global fPager:true, fluid, jQuery*/

// JSLint options
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fPager = fPager || {};

(function ($, fluid) {
    fPager.initPager = function () {
        var resources = {
            users: {
                href: "/tr/_design/app/_view/terms",
                options: {
                    dataType: "json"
                }
            }
        };

        function initPager(resourceSpecs) {

            var model = resourceSpecs.users.resourceText;
            var columnDefs = [
                {
                    key: "entry-unique-id",
                    valuebinding: "*.value.uniqueId",
                    sortable: true
                },
                {
                    key: "entry-term-label",
                    valuebinding: "*.value.termLabel",
                    sortable: true
                },
                {
                    key: "entry-value-space",
                    valuebinding: "*.value.valueSpace",
                    sortable: false
                },
                {
                    key: "entry-definition",
                    valuebinding: "*.value.definition",
                    sortable: false
                },
                {
                    key: "entry-notes",
                    valuebinding: "*.value.notes",
                    sortable: false
                },
                {
                    key: "entry-actions",
                    valuebinding: "*.value._id",
                    components: {
                        target: "/_utils/document.html?tr/${*.value._id}",
                        linktext: "View/Edit"
                    },
                    sortable: false
                }
            ];

            fPager.pager = fluid.pager(".fpager-pager-container", {
                dataModel: model,
                model: {
                    pageSize: 25
                },
                dataOffset: "rows",
                columnDefs: columnDefs,
                annotateColumnRange: "entry-unique-id",
                bodyRenderer: {
                    type: "fluid.pager.selfRender",
                    options: {
                        selectors: {
                            root: ".fpager-pager-table-data"
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

    $(document).ready(function() {
        $("#account").couchLogin({
            loggedIn : function(r) {
                $("#profile").couchProfile(r, {});
                $("#content").show();
                $("#no-content").hide();
                fPager.initPager();
            },
            loggedOut : function() {
                $("#profile").html('<p>Please log in to see your profile.</p>');
                $("#content").hide();
                $("#no-content").show();
            }
        });
    });
})(jQuery, fluid);
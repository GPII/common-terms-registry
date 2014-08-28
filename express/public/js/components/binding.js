// A temporary library to add persistent bindings between form elements and a model

(function ($) {
    "use strict";
    var binding = fluid.registerNamespace("ctr.components.binding");

    binding.applyBinding = function (that) {
        var bindings = that.options.bindings;
        fluid.each(bindings, function (binding) {
            var element = that.locate(binding.selector);
            // in time, break out different ways of accessing the DOM into dedicated functions,
            // index by the "elementType" field we will add to "bindings"
            element.change(function () {
                console.log("Changing model based on element update.");

                var value = element.val();
                if (element.attr('type') === "radio") {
                    element.each(function(index, option) {
                      if (option.checked) {
                          value = $(option).val();
                      }
                    });
                }
                that.data.applier.change(binding.path, value);
            });
            that.data.applier.modelChanged.addListener(binding.path, function (change) {
                console.log("Changing value based on model update.");

                if (element.attr('type') === "radio") {
                    element.each(function(index, option) {
                        if ($(option).val() === change) {
                            option.checked = true;
                        }
                        else {
                            option.checked = false;
                        }
                    });
                }
                else {
                    element.val(change);
                }
            });
        });
    };
})(jQuery);



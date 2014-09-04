// A temporary library to add persistent bindings between form elements and a model

(function ($) {
    "use strict";
    var binder = fluid.registerNamespace("ctr.components.binder");

    binder.setRadioValue = function(element,change) {
        element.each(function(index, option) {
            if ($(option).val() === change) {
                option.checked = true;
            }
            else {
                option.checked = false;
            }
        });
    };

    binder.applyBinding = function (that) {
        var bindings = that.options.bindings;
        fluid.each(bindings, function (binding) {
            var element = that.locate(binding.selector);

            var value = fluid.get(that.model, binding.path);

            // initial sync, model overwrites values
            if (binding.elementType === "radio") {
                binder.setRadioValue(element,value);
            }
            else {
                element.val(value);
            }

            // Update the model when the form changes
            element.change(function () {
                console.log("Changing model based on element update.");

                var value = element.val();
                if (binding.elementType === "radio") {
                    element.each(function(index, option) {
                      if (option.checked) {
                          value = $(option).val();
                      }
                    });
                }
                that.applier.change(binding.path, value);
            });

            // Update the form elements when the model changes
            that.applier.modelChanged.addListener(binding.path, function (change) {
                console.log("Changing value based on model update.");

                if (binding.elementType === "radio") {
                    binder.setRadioValue(element,change);
                }
                else {
                    element.val(change);
                }
            });
        });
    };
})(jQuery);



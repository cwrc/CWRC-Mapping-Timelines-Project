ko.components.register('status', {
    template: '<div data-bind="visible: hasMessages()">\
                   <section data-bind="visible: notices().length > 0">\
                     <ul>\
                         <!-- ko foreach: notices() -->\
                            <li>\
                                <span data-bind="text: $data"></span>\
                                <a href="#" data-bind="visible: $parent.dismissable, \
                                                       click: function(){ $parent.notices.splice($index(), 1)}">X</a>\
                            </li>\
                         <!-- /ko --> \
                     </ul>\
                   </section>\
                   <section data-bind="visible: warnings().length > 0">\
                     <header>Warning</header>\
                     <p data-bind="text: warningFlavour(), visible: warningFlavour()"></p>\
                     <ul>\
                         <!-- ko foreach: warnings() -->\
                            <li>\
                                <span data-bind="text: $data"></span>\
                                <a href="#" data-bind="visible: $parent.dismissable, \
                                                       click: function(){ $parent.warnings.splice($index(), 1)}">X</a>\
                            </li>\
                         <!-- /ko --> \
                     </ul>\
                   </section>\
                   <section data-bind="visible: errors().length > 0">\
                     <ul>\
                         <!-- ko foreach: errors() -->\
                            <li>\
                                <span data-bind="text: $data"></span>\
                                <a href="#" data-bind="visible: $parent.dismissable, \
                                                       click: function(){ $parent.errors.splice($index(), 1)}">X</a>\
                            </li>\
                         <!-- /ko --> \
                     </ul>\
                   </section>\
               </div>',

    viewModel: function (params) {
        var self = this;

        self.dismissable = ko.observable(params.dismissable || false);

        self.notices = params.notices || ko.observableArray([]);
        self.warnings = params.warnings || ko.observableArray([]);
        self.errors = params.errors || ko.observableArray([]);

        // the text below the warnings, describing it
        self.warningFlavour = ko.observable(params.warningFlavour);

        self.hasMessages = function () {
            return self.notices().length > 0 ||
                self.warnings().length > 0 ||
                self.errors().length > 0;
        }
    }
});
ko.components.register('date_filter', {
    template: '<header>Date Slider</header>\
               <div><!--TODO: histogram, probably KO component-->\
               </div>\
               <input type="range"/>\
               <input type="range"/>',

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
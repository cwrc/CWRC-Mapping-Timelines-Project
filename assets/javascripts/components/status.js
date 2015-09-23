ko.components.register('status', {
    template: {element: 'status-template'},

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
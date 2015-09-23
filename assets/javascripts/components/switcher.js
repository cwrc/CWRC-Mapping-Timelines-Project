ko.components.register('switcher', {
    template: {element: 'switcher-template'},

    viewModel: function () {
        var self = this;

        // switcher state
        self.view = ko.observable('map_view');

        self['setView'] = function (name) {
            self.view(name);
        };

        self['isView'] = function (name) {
            return self.view() == name;
        };
    }
});
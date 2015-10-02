ko.components.register('spotlight', {
    template: {element: 'spotlight-template'},

    viewModel: function () {
        var self = this;

        self.selected = CWRC.selected;
    }
});
ko.components.register('spotlight', {
    template: {element: 'spotlight-template'},

    // TODO: simplify API by removing selected() and dynamically finding the field
    // TODO: may want to see if we can fail noisier. Academics won't check the console.
    viewModel: function () {
        var self = this;

        self.selected = CWRC.selected;
    }
});
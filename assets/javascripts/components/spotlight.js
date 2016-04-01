ko.components.register('spotlight', {
    template: {element: 'spotlight-template'},

    viewModel: function () {
        var self = this;

        self.selected = CWRC.selected;

        self.lightboxVisible = ko.observable(false);

        self['toggleLightbox'] = function () {
            self.lightboxVisible(!self.lightboxVisible())
        }
    }
});
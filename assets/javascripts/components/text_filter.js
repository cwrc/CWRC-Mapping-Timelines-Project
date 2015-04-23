ko.components.register('text_filter', {
    template: '<header>Search</header>\
               <input type="search" placeholder="eg. Rocky Mountains" data-bind="event: {keyup: filterText}"/>',

    viewModel: function (params) {
        var self = this;

        self.timer = null;

        self['filterText'] = function () {
            if (self.timer)
                window.clearTimeout(self.timer);

            self.timer = window.setTimeout(function () {
                // TODO: actually filter
                alert('Not implmemented');

            }, 250);
        };
    }
});
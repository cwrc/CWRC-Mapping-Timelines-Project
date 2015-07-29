ko.components.register('text_filter', {
    template: '<header>Search</header>\
               <input type="search" placeholder="eg. Rocky Mountains" data-bind="value: filterText, valueUpdate:\'keyup\', event: {keyup: fireFilter}"/>',

    viewModel: function (params) {
        var self = this;

        self.timer = null;
        self.filterText = ko.observable();

        self['filter'] = function (item) {
            var filterText = self.filterText().toLowerCase();

            for (var field in item) {
                if (item.hasOwnProperty(field)) {
                    var value = item[field].toString().toLowerCase();

                    return value.indexOf(filterText) >= 0;
                }
            }

            return false;
        };

        self['fireFilter'] = function () {
            // Using timeouts to throttle the filtering, otherwise it becomes sluggish
            if (self.timer)
                window.clearTimeout(self.timer);

            self.timer = window.setTimeout(function () {
                CWRC.filters.push(self['filter']);
            }, 250);

            return true; // return true to do the default action
        };
    }
});
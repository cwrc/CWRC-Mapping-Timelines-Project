ko.components.register('text_filter', {
    template: '<header>Search</header>\
               <input type="search" placeholder="eg. Rocky Mountains" data-bind="textInput: filterText"/>',

    viewModel: function (params) {
        var self = this;

        // Using timeouts to throttle the filtering, otherwise it becomes sluggish
        self.filterText = ko.observable('').extend({method: 'notifyWhenChangesStop', rateLimit: 300 });

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

        CWRC.filters.push(self['filter']);
    }
});
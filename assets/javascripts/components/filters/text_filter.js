ko.components.register('text_filter', {
    template: '<header>\
                    <span data-bind="text: label"></span>\
               </header>\
               <input type="search" data-bind="textInput: filterText, attr: {placeholder: placeholder}"/>',

    /**
     * Parameters:
     * * label: The label to display (optional)
     * * placeholder: The greyed out prompt text
     * @param params
     */
    viewModel: function (params) {
        var self = this;

        self.label = params['label'] || 'Search';
        self.placeholder = params['placeholder'] || 'eg. University of Alberta';

        // Using timeouts to throttle the filtering, otherwise it becomes sluggish
        self.filterText = ko.observable('').extend({method: 'notifyWhenChangesStop', rateLimit: 300});

        self['reset'] = function () {
            self.filterText('');
        };

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
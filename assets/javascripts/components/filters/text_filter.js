ko.components.register('text_filter', {
    template: '<header>\
                    <span data-bind="text: label"></span>\
               </header>\
               <input type="search" data-bind="textInput: filterText, attr: {placeholder: placeholder}"/>',

    /**
     * Parameters:
     * @param label: The label to display
     * @param placeholder: The greyed out prompt text
     */
    viewModel: function (params) {
        var self = this;

        self.label = params['label'] || 'Search';
        self.placeholder = params['placeholder'] || 'eg. University of Alberta';

        // Using timeouts to throttle the filtering, otherwise it becomes sluggish
        // Also, history extender *must* be before the 'method' and 'rateLimit' extenders, otherwise
        // it and other observables using history have problems with setting defaults
        self.filterText = ko.observable().extend({
            history: {
                label: self.label,
                querySymbol: 's',
                formatWith: function (value) {
                    return value ? '"' + value + '"' : '(none)';
                }
            },
            rateLimit: {
                timeout: 300,
                method: 'notifyWhenChangesStop'
            }
        });

        self['reset'] = function () {
            self.filterText('');
        };

        self['filter'] = function (item) {
            var filterText = (self.filterText() || '').toLowerCase();

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

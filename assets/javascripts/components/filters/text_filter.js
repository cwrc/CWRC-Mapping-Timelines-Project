ko.components.register('text_filter', {
    template: '<header>\
                    <span data-bind="text: label"></span>\
               </header>\
               <input type="search" data-bind="textInput: filterTextDisplay, attr: {placeholder: placeholder}"/>',

    /**
     * Parameters:
     * @param label: The label to display
     * @param placeholder: The greyed out prompt text
     */
    viewModel: function (params) {
        var self = this;

        self.label = params['label'];
        if (self.label == null)
            self.label = 'Search';

        self.placeholder = params['placeholder'] || 'eg. University of Alberta';

        self.rateLimitTimeout = 300; // ms

        /*
         * Separated display text and filter value to allow for the filter value to be rate limited, but the display
         * text to update immediately with the history extender. This also constructs what is effectively a rateLimit extender
         * but with the added feature that it can be temporarily disabled.
         *
         * If they're together, rateLimit interferes in history + reset() interaction.
         */

        self.filterText = ko.observable().extend({
            history: {
                label: self.label,
                querySymbol: 's',
                formatWith: function (value) {
                    return value ? '"' + value + '"' : '(none)';
                }
            }
        });
        self.filterTextDisplay = ko.observable(self.filterText());

        self.textUpdater = null;
        self.filterTextDisplay.subscribe(function (newVal) {
            clearTimeout(self.textUpdater);

            if (self.rateLimitTimeout)
                self.textUpdater = setTimeout(function () {
                    self.filterText(newVal);
                }, self.rateLimitTimeout);
            else
                self.filterText(newVal);
        });

        self.filterText.subscribe(function (newVal) {
            self.filterTextDisplay(newVal)
        });

        self['reset'] = function () {
            var oldTimeout = self.rateLimitTimeout;
            self.rateLimitTimeout = 0;

            self.filterTextDisplay('');

            self.rateLimitTimeout = oldTimeout;
        };

        self['filter'] = function (item) {
            var filterText = (self.filterText() || '').toLowerCase();

            for (var field in item) {
                if (item.hasOwnProperty(field)) {
                    var value = item[field].toString().toLowerCase();

                    if (value.indexOf(filterText) >= 0)
                        return true;
                }
            }

            return false;
        };

        CWRC.filters.push(self['filter']);
    }
});


/**
 * Knockout extender to enhance the behaviour of an observable.
 *
 * @param target the Knockout observable to be extended
 * @param params Includes:
 *                  - label: the name of the state
 *                  - querySymbol: the variable name for the query string value
 * @returns {*} extended target observable
 */
ko.extenders.history = function (target, params) {
    target.__updatingFromHistory__ = false;

    History.Adapter.bind(window, 'statechange', function () {
        var data;

        data = History.getState().data[params.querySymbol];

        //console.log('READ ' + params.label + ':')
        //console.log(state.data);
        //console.log('')

        if (target() != data) {
            target.__updatingFromHistory__ = true;
            target(data || '');
            target.__updatingFromHistory__ = false;
        }
    });

    target.subscribe(function (newVal) {
        var data, label, uri;

        if (target.__updatingFromHistory__)
            return;

        uri = URI(location.search);
        data = {};

        // checking length covers strings and arrays
        if (newVal.length > 0) {
            uri.setSearch(params.querySymbol, newVal);
            label = params.label + ' "' + newVal + '" - ';
            data[params.querySymbol] = newVal;
        } else {
            uri.removeSearch(params.querySymbol);
            label = '';
            delete data[params.querySymbol];
        }

        //console.log('SAVE ' + params.label + ' Filter:')
        //console.log(stateData)
        //console.log('')

        History.pushState(data, label + 'Plot-It', uri.toString() || '?')
    });

    return target;
};


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

        self.querySymbol = 's';

        // Using timeouts to throttle the filtering, otherwise it becomes sluggish
        self.filterText = ko.observable().extend({
            method: 'notifyWhenChangesStop',
            rateLimit: 300,
            history: {
                label: self.label,
                querySymbol: self.querySymbol
            }
        });
        // setting default separately to trigger extenders
        self.filterText(URI.parseQuery(location.search)[self.querySymbol] || '');

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

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

        if (target != data) {
            target.__updatingFromHistory__ = true;
            target(data || '');
            target.__updatingFromHistory__ = false;
        }
    });

    target.subscribe(function (newVal) {
        var stateData, stateLabel, stateUri;

        if (target.__updatingFromHistory__)
            return;

        // TODO: replace the value in the query string & data packet, or remove it entirely if it is empty.
        if (newVal.length > 0) {
            stateLabel = params.label + ' "' + newVal + '" - ';
            stateUri = '?' + params.querySymbol + '=' + newVal;
        } else {
            stateLabel = '';
            stateUri = '?';
        }

        stateData = {};
        if (newVal)
            stateData[params.querySymbol] = newVal;

        //console.log('SAVE ' + params.label + ' Filter:')
        //console.log(stateData)
        //console.log('')

        History.pushState(stateData, stateLabel + 'PlotIt', stateUri)
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

        // Using timeouts to throttle the filtering, otherwise it becomes sluggish
        self.filterText = ko.observable(CWRC.Network.getParam('s') || '').extend({
            method: 'notifyWhenChangesStop',
            rateLimit: 300,
            history: {
                label: self.label,
                querySymbol: 's'
            }
        });

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
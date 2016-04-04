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
            rateLimit: 300
        });

        self.updating = false;
        History.Adapter.bind(window, 'statechange', function () {
            var state = History.getState();
            var data = state.data['s'];

            //if (data == undefined)
            //    return;

            //console.log('READ ' + self.label + ':')
            //console.log(state.data);
            //console.log('')

            if (self.filterText() != data) {
                self.updating = true;
                self.filterText(data || '');
                self.updating = false;
            }
        });

        self.filterText.subscribe(function (newVal) {
            var stateData, stateLabel, stateUri, fieldName;

            fieldName = 's';

            if (self.updating)
                return;

            if (newVal.length > 0) {
                stateLabel = self.label + ' "' + newVal + '" - ';
                stateUri = '?' + fieldName + '=' + newVal;
            } else {
                stateLabel = '';
                stateUri = '?';
            }

            stateData = {};
            if (newVal)
                stateData[fieldName] = newVal;

            //console.log('SAVE ' + self.label + ' Filter:')
            //console.log(stateData)
            //console.log('')

            History.pushState(stateData, stateLabel + 'PlotIt', stateUri)
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
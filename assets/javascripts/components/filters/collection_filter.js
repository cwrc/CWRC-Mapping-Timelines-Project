ko.components.register('checklist_filter', {
    template: '<header>\
                    <span data-bind="text: label"></span>\
                    <label>\
                        <input type="checkbox" title="Select All/None" data-bind="checked: checkAll"/>\
                        All\
                    </label>\
               </header>\
               <div data-bind="foreach: eventValues">\
                    <div>\
                         <label>\
                              <input type="checkbox" data-bind="checkedValue: $data, checked: $parent.selectedEventValues"/>\
                              <span data-bind="text: $data"></span>\
                         </label>\
                    </div>\
               </div>',


    // TODO: include counts? ie. the number of each value that exist?
    viewModel: function (params) {
        var self = this;

        self.label = params['label'] || 'Property';

        self.eventFieldName = params['field'] || alert('Error. Please provide "field" parameter to checklist facet.')

        self.selectedEventValues = ko.observableArray();
        self.eventValues = ko.computed(function () {
            var data, event, uniqueEventValues;

            data = CWRC.rawData(); // TODO: should this be filtered data? ie. should it redraw the widgets to exclude impossible selections?
            uniqueEventValues = Object.create(null);

            for (var i = 0; i < data.length; i++) {
                event = data[i];

                uniqueEventValues[event[self.eventFieldName]] = true;
            }

            self.selectedEventValues(Object.keys(uniqueEventValues));

            return Object.keys(uniqueEventValues);
        });

        self.checkAll = ko.pureComputed({
            read: function () {
                // Comparing length is quick and is accurate if only items from the
                // main array are added to the selected array.
                return self.selectedEventValues().length === self.eventValues().length;
            },
            write: function (value) {
                self.selectedEventValues(value ? self.eventValues().slice(0) : []);
            }
        });

        self['filter'] = function (event) {
            var eventValue;

            return self.selectedEventValues.indexOf(event[self.eventFieldName]) >= 0;
        };

        CWRC.filters.push(self['filter']);
    }
});
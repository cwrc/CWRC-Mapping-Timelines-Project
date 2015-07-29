ko.components.register('checklist_filter', {
    template: '<div data-bind="foreach: Object.keys(eventValuesToSelected())">\
                    <label>\
                        <input type="checkbox" placeholder="eg. Rocky Mountains" data-bind="attr: {value: $data}, checked: $parent.eventValuesToSelected()[$data]"/>\
                        <span data-bind="text: $data"></span>\
                    </label>\
               </div>',

    // TODO: include counts? ie. the number of each value that exist?
    viewModel: function (params) {
        var self = this;

        self.eventFieldName = params['field'] || alert('Error. Please provide "field" parameter to checklist facet.')

        self.eventValuesToSelected = ko.computed(function () {
            var data, event, eventValue, valuesToSelected;

            data = CWRC.rawData(); // TODO: should this be filtered data? ie. should it redraw the widgets to exclude impossible selections?
            valuesToSelected = Object.create(null);

            for (var i = 0; i < data.length; i++) {
                event = data[i];

                eventValue = event[self.eventFieldName];

                valuesToSelected[eventValue] = ko.observable(true);

//                pointsToCounts[dataPoint] = (pointsToCounts[dataPoint] || 0) + 1;
            }

            return valuesToSelected;
        });

        self['filter'] = function (event) {
            var eventValuesToSelected = self.eventValuesToSelected();

            for (var dataPoint in eventValuesToSelected) {
                var isSelected = eventValuesToSelected[dataPoint]();

                if (isSelected && event[self.eventFieldName] === dataPoint)
                    return true;
            }

            return false;
        };

        CWRC.filters.push(self['filter']);
    }
});
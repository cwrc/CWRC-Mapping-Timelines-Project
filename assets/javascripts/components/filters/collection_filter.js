ko.components.register('checklist_filter', {
    template: '<div data-bind="foreach: Object.keys(dataPointsToSelected())">\
                    <label>\
                        <span data-bind="text: $data"></span>\
                        <input type="checkbox" placeholder="eg. Rocky Mountains" data-bind="attr: {value: $data}, checked: $parent.dataPointsToSelected()[$data]"/>\
                    </label>\
               </div>',

    // TODO: include counts? ie. the number of each value that exist?
    viewModel: function (params) {
        var self = this;

        self.fieldName = params['field'] || alert('Error. Please provide "field" parameter to checklist facet.')
//        self.selectedDataPoints = ko.observableArray();

        self.dataPointsToSelected = ko.computed(function () {
            var data, dataPoint, pointsToSelected;

            data = CWRC.rawData();
            pointsToSelected = Object.create(null);

            for (var i = 0; i < data.length; i++) {
                dataPoint = data[i][self.fieldName];

                pointsToSelected[dataPoint] = ko.observable(true);

//                pointsToCounts[dataPoint] = (pointsToCounts[dataPoint] || 0) + 1;
            }

            return pointsToSelected;
        });

        self['filter'] = function (event) {
            var dataPointsToSelected = self.dataPointsToSelected();

            for (var dataPoint in dataPointsToSelected) {
                var isSelected = dataPointsToSelected[dataPoint]();

                if (isSelected && event[self.fieldName] === dataPoint)
                    return true;
            }

            return false;
        };

        CWRC.filters.push(self['filter']);
    }
});
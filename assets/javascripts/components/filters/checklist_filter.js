ko.components.register('checklist_filter', {
    template: '<header>\
                    <span data-bind="text: label"></span>\
                    (<a href="#" data-bind="click: function(){ enabled(!enabled()) }, text: enableText"></a>)\
                    <label>\
                        <input type="checkbox" title="Select All/None" data-bind="checked: checkAll, enable: enabled"/>\
                        All\
                    </label>\
               </header>\
               <div data-bind="visible: enabled, foreach: eventValues">\
                    <div>\
                         <label>\
                              <input type="checkbox" data-bind="checkedValue: $data, \
                                                                checked: $parent.selectedEventValues, \
                                                                enable: $parent.enabled"/>\
                              <span data-bind="text: $data"></span>\
                              <span>(<span data-bind="text: $parent.eventValueCounts[$data]"></span>)<span>\
                         </label>\
                    </div>\
               </div>',

    /**
     * Parameters:
     * * field: The name of the object field to filter by
     * * label: The label to display (optional)
     * @param params
     */
    viewModel: function (params) {
        var self = this;

        self.eventFieldName = params['field'] || alert('Error. Please provide "field" parameter to checklist facet.')

        self.label = params['label'] || ('Property: ' + self.eventFieldName);

        self.enabled = ko.observable(true);
        self.enableText = ko.pureComputed(function () {
            return self.enabled() ? 'on' : 'off';
        });

        self.selectedEventValues = ko.observableArray();
        self.eventValueCounts = Object.create(null);
        self.eventValues = ko.computed(function () {
            var data, event, eventValue, uniqueEventValues;

            data = CWRC.rawData(); // TODO: should this be filtered data? ie. should it redraw the widgets to exclude impossible selections?
            uniqueEventValues = Object.create(null);

            for (var i = 0; i < data.length; i++) {
                event = data[i];

                eventValue = event[self.eventFieldName]

                uniqueEventValues[eventValue] = true;

                self.eventValueCounts[eventValue] = self.eventValueCounts[eventValue] + 1 || 1;
            }

            self.selectedEventValues(Object.keys(uniqueEventValues));


            return Object.keys(uniqueEventValues).sort();
        });

        self.checkAll = ko.pureComputed({
            read: function () {
                // Comparing length is quick and is accurate if only items from the
                // main array are added to the selected array.
                return self.selectedEventValues().length === self.eventValues().length;
            },
            write: function (value) {
                // TODO: don't allow de-selecting. It's a mutual exlusive.
                self.selectedEventValues(value ? self.eventValues().slice(0) : []);
            }
        });

        self['filter'] = function (event) {
            var eventValue;

            if (self.enabled())
                return self.selectedEventValues.indexOf(event[self.eventFieldName]) >= 0;
            else {
                return true;
            }
        };

        self['reset'] = function () {
            self.checkAll(true);
        };

        CWRC.filters.push(self['filter']);
    }
});
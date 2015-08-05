ko.components.register('checklist_filter', {
    template: '<header>\
                    <span data-bind="text: label"></span>\
                    (<a href="#" data-bind="click: function(){ enabled(!enabled()) }, text: enableText"></a>)\
                    <label>\
                        <input type="checkbox" title="Select All/None" data-bind="checked: allChecked, enable: allCheckEnabled"/>\
                        All\
                    </label>\
               </header>\
               <div data-bind="visible: enabled, foreach: Object.keys(rawEventValuesToCounts()).sort()">\
                    <div>\
                         <label>\
                              <input type="checkbox" data-bind="checkedValue: $data, \
                                                                checked: $parent.selectedEventValues, \
                                                                enable: $parent.enabled"/>\
                              <span data-bind="text: $data"></span>\
                              <span>(<span data-bind="text: $parent.filteredEventValuesToCounts()[$data] || 0"></span>/<span data-bind="text: $parent.rawEventValuesToCounts()[$data]"></span>)<span>\
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

        self['countData'] = function (dataList) {
            var eventValue, eventValuesToCounts, observable;

            eventValuesToCounts = Object.create(null);

            dataList.forEach(function (event) {
                eventValue = event[self.eventFieldName];

                observable = eventValuesToCounts[eventValue];

                // only assign a new observable if one is missing
                if (!observable)
                    eventValuesToCounts[eventValue] = observable = ko.observable(0);

                observable(observable() + 1);
            });

            return eventValuesToCounts;
        };

        self.filteredEventValuesToCounts = ko.pureComputed(function () {
            return self.countData(CWRC.filteredData());
        });

        self.rawEventValuesToCounts = ko.computed(function () {
            var eventValuesToCounts = self.countData(CWRC.rawData());

            self.selectedEventValues(Object.keys(eventValuesToCounts));

            return eventValuesToCounts;
        });

        self.allChecked = ko.pureComputed({
            read: function () {
                // Comparing length is quick and is accurate if only items from the
                // main array are added to the selected array.
                return self.selectedEventValues().length === Object.keys(self.rawEventValuesToCounts()).length;
            },
            write: function (value) {
                self.selectedEventValues(value ? self.rawEventValues().slice(0) : []);
            }
        });

        self['allCheckEnabled'] = ko.pureComputed(function () {
            return self.enabled() && !self.allChecked();
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
            self.allChecked(true);
        };

        CWRC.filters.push(self['filter']);
    }
});
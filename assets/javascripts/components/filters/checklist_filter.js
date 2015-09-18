ko.components.register('checklist_filter', {
    template: '<header>\
                    <a href="#" data-bind="click: function(){ isExpanded(!isExpanded()) }">\
                        <span data-bind="text: label"></span>\
                        <span data-bind="text: expandText"></span>\
                    </a>\
                    <label>\
                        <input type="checkbox" title="Select All/None" data-bind="checked: allChecked, enable: allCheckEnabled"/>\
                        All\
                    </label>\
               </header>\
               <div data-bind="visible: isExpanded, foreach: rawEventValues()">\
                    <div>\
                         <label>\
                              <input type="checkbox" data-bind="checkedValue: $data, \
                                                                checked: $parent.selectedEventValues"/>\
                              <span data-bind="text: $data"></span>\
                              <span>(<span data-bind="text: $parent.filteredEventValuesToCounts()[$data] || 0"></span>/<span data-bind="text: $parent.rawEventValuesToCounts()[$data]"></span>)<span>\
                         </label>\
                    </div>\
               </div>',

    /**
     * A checklist of fields groups by values. Only those fields that are checked will pass the filter.
     *
     * @param field: The name of the object field to filter by
     * @param label: The label to display (optional)
     */
    viewModel: function (params) {
        var self = this;

        self.eventFieldName = params['field'] || alert('Error. Please provide "field" parameter to checklist facet.')

        self.label = params['label'] || ('Property: ' + self.eventFieldName);

        self.isExpanded = ko.observable(true);
        self.expandText = ko.pureComputed(function () {
            return self.isExpanded() ? '\u25Be' : '\u25B4';
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
        self.filteredEventValues = function () {
            return Object.keys(self.filteredEventValuesToCounts()).sort();
        };

        self.rawEventValuesToCounts = ko.computed(function () {
            return self.countData(CWRC.rawData());
        });
        self.rawEventValues = function () {
            return Object.keys(self.rawEventValuesToCounts()).sort();
        };

        self.allChecked = ko.computed({
            read: function () {
                var fullList = self.selectedEventValues().length === self.rawEventValues().length;

                if (fullList)
                    self.selectedEventValues([]);

                // Comparing length is quick and is accurate if only items from the
                // main array are added to the selected array.
                return fullList || self.selectedEventValues().length === 0;
            },
            write: function (value) {
                self.selectedEventValues([]);
            }
        });

        self['allCheckEnabled'] = ko.pureComputed(function () {
            return !self.allChecked();
        });

        self['filter'] = function (event) {
            var eventValue;

            return self.allChecked() || self.selectedEventValues.indexOf(event[self.eventFieldName]) >= 0;
        };

        self['reset'] = function () {
            self.allChecked(true);
        };

        CWRC.filters.push(self['filter']);
    }
});
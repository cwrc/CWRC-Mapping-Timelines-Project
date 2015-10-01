ko.components.register('checklist_filter', {
    template: '<header>\
                    <expander params="expandedText: label, collapsedText: label, expandedObservable: isExpanded"></expander>\
                    <label>\
                        <input type="checkbox" title="Select All/None" data-bind="checked: allChecked, enable: allCheckEnabled"/>\
                        All\
                    </label>\
               </header>\
               <div data-bind="visible: isExpanded, foreach: rawRecordValues()">\
                    <div>\
                         <label>\
                              <input type="checkbox" data-bind="checkedValue: $data, \
                                                                checked: $parent.selectedRecordValues"/>\
                              <span data-bind="text: $data"></span>\
                              <span>(<span data-bind="text: $parent.filteredRecordValuesToCounts()[$data] || 0"></span>/<span data-bind="text: $parent.rawRecordValuesToCounts()[$data]"></span>)<span>\
                         </label>\
                    </div>\
               </div>',

    /**
     * A checklist of fields groups by values. Only those fields that are checked will pass the filter.
     *
     * @param label: The label to display
     * @param field: The object field to group as a facet, as a javascript string (required)
     */
    viewModel: function (params) {
        var self = this;

        self.recordFieldName = params['field'] || alert('Error. Please provide "field" parameter to checklist facet.');

        self.label = params['label'] || ('Property: ' + self.recordFieldName);

        self.isExpanded = ko.observable(true);
        self.expandText = ko.pureComputed(function () {
            return self.isExpanded() ? '\u25Be' : '\u25B4';
        });

        self.selectedRecordValues = ko.observableArray();

        self['countData'] = function (dataList) {
            var recordValue, recordValuesToCounts, observable;

            recordValuesToCounts = Object.create(null);

            dataList.forEach(function (record) {
                recordValue = record[self.recordFieldName];

                observable = recordValuesToCounts[recordValue];

                // only assign a new observable if one is missing
                if (!observable)
                    recordValuesToCounts[recordValue] = observable = ko.observable(0);

                observable(observable() + 1);
            });

            return recordValuesToCounts;
        };

        self.filteredRecordValuesToCounts = ko.pureComputed(function () {
            return self.countData(CWRC.filteredData());
        });
        self.filteredRecordValues = function () {
            return Object.keys(self.filteredRecordValuesToCounts()).sort();
        };

        self.rawRecordValuesToCounts = ko.computed(function () {
            return self.countData(CWRC.rawData());
        });
        self.rawRecordValues = function () {
            return Object.keys(self.rawRecordValuesToCounts()).sort();
        };

        self.allChecked = ko.computed({
            read: function () {
                var fullList = self.selectedRecordValues().length === self.rawRecordValues().length;

                if (fullList)
                    self.selectedRecordValues([]);

                // Comparing length is quick and is accurate if only items from the
                // main array are added to the selected array.
                return fullList || self.selectedRecordValues().length === 0;
            },
            write: function (value) {
                self.selectedRecordValues([]);
            }
        });

        self['allCheckEnabled'] = ko.pureComputed(function () {
            return !self.allChecked();
        });

        self['filter'] = function (record) {
            return self.allChecked() || self.selectedRecordValues.indexOf(record[self.recordFieldName]) >= 0;
        };

        self['reset'] = function () {
            self.allChecked(true);
        };

        CWRC.filters.push(self['filter']);
    }
});
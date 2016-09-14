ko.components.register('checklist_filter', {
    template: ' <header>\
                    <expander params="expandedText: label, collapsedText: label, expandedElement: getExpandedNode"></expander>\
                    <label>\
                        <input type="checkbox" title="Select All/None" data-bind="checked: allChecked, enable: allCheckEnabled"/>\
                        All\
                    </label>\
                </header>\
                <div class="checklist-content">\
                    <resizer>\
                        <!-- ko foreach: $parent.rawRecordValues()-->\
                            <div class="checklist-row">\
                                <label>\
                                    <input type="checkbox" data-bind="checkedValue: $data, \
                                                                        checked: $parents[1].selectedRecordValues"/>\
                                    <span data-bind="text: $data"></span>\
                                    <span>(<span data-bind="text: $parents[1].filteredRecordValuesToCounts()[$data] || 0"></span>/<span data-bind="text: $parents[1].rawRecordValuesToCounts()[$data]"></span>)<span>\
                                </label>\
                            </div>\
                        <!-- /ko -->\
                    </resizer>\
                </div>',

    /**
     * A checklist of fields groups by values. Only those fields that are checked will pass the filter.
     *
     * @param label: The label to display
     * @param field: The object field to group as a facet, as a javascript string (required)
     */
    viewModel: function (params) {
        var self = this;

        self.getExpandedNode = function () {
            var nodes, node, myNode;

            nodes = document.querySelectorAll('checklist_filter .checklist-content');

            for (var i = 0; i < nodes.length; i++) {
                node = nodes[i];

                if (ko.dataFor(node) == self) {
                    myNode = node;
                    break;
                }
            }

            return myNode;
        };

        self.recordFieldName = params['field'] || alert('Error: Please provide "field" parameter to <checklist_filter> facet filter.');

        self.transitionDuration = 350; // ms

        self.label = params['label'] || ('Property: ' + self.recordFieldName);

        self.selectedRecordValues = ko.observableArray().extend({
            history: {
                label: self.label,
                querySymbol: self.label.toLowerCase(),
                formatWith: function (value) {
                    return value.length > 0 ? value.join(', ') : '(All)';
                }
            }
        });

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
            if (self.allChecked())
                return true;

            var isLegalValue, value;

            value = record[self.recordFieldName];

            if (value instanceof Array)
                isLegalValue = value.some(function (element) {
                    return self.selectedRecordValues.indexOf(element) >= 0;
                });
            else
                isLegalValue = self.selectedRecordValues.indexOf(value) >= 0;

            return isLegalValue;
        };

        self['reset'] = function () {
            self.allChecked(true);
        };

        CWRC.filters.push(self['filter']);
    }
});
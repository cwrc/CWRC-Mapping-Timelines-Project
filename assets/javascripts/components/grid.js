ko.components.register('grid', {
    template: {element: 'grid-template'},

    /**
     * A table listing records and the given fields. The table is sortable my multiple fields, in order of preference.
     *
     * @param columns: Hash in the form of {ColumnLabel: 'fieldName', ColumnLabel2: 'fieldName2'} (Required)
     * @param pageSize: the number of items per page. Default: 20
     * @param initialSortBy: an array of field names by which to sort, in order of priority. Use a suffix of -za to get reverse order. eg. ['startdate', 'longName-za']. Optional; if not given, then no sorting will be done.
     */
    viewModel: function (params) {
        var self = this;

        self.columns = params['columns'] || alert("Error: You must provide the 'columns' parameter to <grid>.");
        self.sortContexts = ko.observableArray();

        var SortContext = function (fieldString) {
            var self = this;
            var split = (fieldString || '').split('-');

            self.name = ko.observable(split[0]);
            self.direction = ko.observable((split[1] || 'az').toLowerCase());

            self['getFieldDirectionLabel'] = function () {
                return self.direction() == 'az' ? 'A->Z' : 'Z->A';
            };

            self['reverse'] = function () {
                var index, reversedLabel, direction;

                self.direction(self.direction() == 'az' ? 'za' : 'az');
            };
        };

        // assumes all data objects have same format.
        self.allFields = ko.pureComputed(function () {
            return Object.keys(CWRC.rawData()[0] || {}).map(function (fieldString) {
                return new SortContext(fieldString);
            });
        });

        self.addContext = function () {
            self.sortContexts.push(new SortContext());
        };

        self['removeSortBy'] = function (fieldName) {
            var index = self.sortContexts.indexOf(fieldName);
            self.sortContexts.splice(index, 1);
        };

        CWRC.rawData.subscribe(function () {
            // this needs to be loaded on data changing, not on init.

            self.sortContexts(params['initialSortBy'].map(function (fieldString) {
                return new SortContext(fieldString);
            }))
        });

        self.items = ko.pureComputed(function () {
            var unsorted, direction, nameAndDirection, result, sortContexts, fieldName, sortFunction, collator, sortContext;

            unsorted = Array.prototype.slice.call(CWRC.filteredData());
            sortContexts = self.sortContexts();
            result = 0;

            try {
                collator = new Intl.Collator('en', {
                    sensitivity: 'base',
                    ignorePunctuation: true
                });
            } catch (e) {
                collator = null
            }

            sortFunction = function (a, b) {
                // Find the first sort criteria that gives a non-same result,
                // (That's why we need "break" here, and cannot use Array's forEach() )
                for (var i = 0; i < sortContexts.length; i++) {
                    sortContext = sortContexts[i];

                    fieldName = sortContext.name();

                    if (!fieldName)
                        break;

                    // collator doesn't exist in all platforms. Fall back to (much) slower localeCompare
                    if (collator) {
                        result = collator.compare(a[fieldName], b[fieldName]);
                    } else {
                        result = a[fieldName].localeCompare(b[fieldName], 'en', {
                            sensitivity: 'base',
                            ignorePunctuation: true
                        });
                    }

                    if (sortContext.direction() == 'za')
                        result *= -1;

                    if (result != 0)
                        break;
                }

                return result;
            };

            if (sortContexts.length > 0) {
                return unsorted.sort(sortFunction);
            } else {
                return unsorted;
            }
        });

        self.currentPageIndex = ko.observable(1);
        self.pageSize = params.pageSize || 20;

        self.itemsOnCurrentPage = ko.pureComputed(function () {
            var startIndex = self.pageSize * (self.currentPageIndex() - 1);

            return self.items().slice(startIndex, startIndex + self.pageSize);
        });

        self.maxPageIndex = ko.pureComputed(function () {
            return Math.ceil(self.items().length / self.pageSize);
        });

        self.pageNeighbourhoodDistance = 1;
        self.pageNeighbourhood = ko.pureComputed(function () {
            var low = Math.max(1, self.currentPageIndex() - self.pageNeighbourhoodDistance);
            var high = Math.min(self.maxPageIndex(), self.currentPageIndex() + self.pageNeighbourhoodDistance);

            return ko.utils.range(low, high);
        });

        self['getColumnClass'] = function (columnLabel) {
            return 'grid-' + columnLabel.replace(/\s/, '-').toLowerCase();
        };

        self['setPage'] = function (index) {
            self.currentPageIndex(index);
        };

        self['isFarAway'] = function (pageIndex) {
            return self.pageNeighbourhood().indexOf(pageIndex) < 0
        }
    }
});

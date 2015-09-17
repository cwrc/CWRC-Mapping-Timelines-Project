ko.components.register('grid', {
    template: '<div>\
                    Sort <span data-bind="visible: sortContexts().length > 0">by</span>\
                    <!-- Building a "widget" for editing each sorting context-->\
                    <div data-bind="foreach: sortContexts">\
                        <div>\
                            <select data-bind="options: $parent.allFields, optionsText: \'name\', optionsValue: \'name\', optionsCaption:\'Choose...\', value: $data.name"></select>\
                            <a href="#" data-bind="click: function() { $data.reverse() }, text: $data.getFieldDirectionLabel()"></a>\
                            <a href="#" data-bind="click: function() { $parent.removeSortBy($data) }">x</a>\
                        </div>\
                        , then\
                    </div>\
                    <a href="#" title="Add Sorting Rule" data-bind="click: addContext ">by...</a>\
               </div>\
               <table>\
                    <!-- explicit thead & tbody are important, otherwise the browser assumes incorrect things-->\
                    <thead>\
                        <tr>\
                            <th></th>\
                            <!-- ko foreach: Object.keys(columns) -->\
                                <th data-bind="text: $data">\
                                </th>\
                            <!-- /ko -->\
                        </tr>\
                    </thead>\
                    <tbody data-bind="foreach: {data: itemsOnCurrentPage, as: \'item\'}">\
                        <tr data-bind="">\
                            <td>\
                                <a href="#" data-bind="click: function(){ CWRC.selected(item)}">\
                                    Select\
                                </a>\
                            </td>\
                            <!-- ko foreach: {data: Object.keys($parent.columns), as: \'columnLabel\'} -->\
                                <td data-bind="html: item[$parents[1].columns[columnLabel]] || \'n/a\', css: $parents[1].getColumnClass(columnLabel)">\
                                </td>\
                            <!-- /ko -->\
                        </tr>\
                    </tbody>\
               </table>\
               <section>\
                   <span data-bind="visible: isFarAway(1)">\
                        <a href="#" data-bind="text: 1, click: function(){ setPage(1) }, attr: {selected: currentPageIndex() == 1}"></a>\
                        <span data-bind="visible: isFarAway(2)">\
                            ...\
                        </span>\
                   </span>\
                   <span data-bind="foreach: pageNeighbourhood">\
                        <a href="#" data-bind="text: $data, click: function(){ $parent.setPage($data) }, attr: {selected: $parent.currentPageIndex() == $data}"></a>\
                   </span>\
                   <span data-bind="visible: isFarAway(maxPageIndex())">\
                        <span data-bind="visible: isFarAway(maxPageIndex() - 1)">\
                            ...\
                        </span>\
                        <a href="#" data-bind="text: maxPageIndex, click: function(){ setPage(maxPageIndex()) }, attr: {selected: currentPageIndex() == maxPageIndex()}"></a>\
                   </span>\
               </section>',

    /**
     * A table representation of data.
     *
     * @param columns: Hash in the form of {ColumnLabel: 'fieldName', ColumnLabel2: 'fieldName2'} (Required)
     * @param nowrap: List of column names that should have line-wrap disabled.
     * @param pageSize: the number of items per page. Default: 10
     * @param initialSortBy: an array of field names by which to sort, in order of priority. Use a suffix of -za to get reverse order. eg. ['startdate', 'longName-za']. Optional; if not given, then no sorting will be done.
     */
    viewModel: function (params) {
        var self = this;

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
            return Object.keys(CWRC.rawData()[0]).map(function (fieldString) {
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

        self.columns = params['columns'];
        self.sortContexts = ko.observableArray(params['initialSortBy'].map(function (fieldString) {
            return new SortContext(fieldString);
        }));

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
                        result = collator.compare(a[fieldName].trim(), b[fieldName].trim());
                    } else {
                        result = a[fieldName].trim().localeCompare(b[fieldName].trim(), 'en', {
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
            return 'grid-' + columnLabel;
        };

        self['setPage'] = function (index) {
            self.currentPageIndex(index);
        };

        self['isFarAway'] = function (pageIndex) {
            return self.pageNeighbourhood().indexOf(pageIndex) < 0
        }
    }
});
ko.components.register('grid', {
    template: '<table>\
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
     * A table represetnation of data.
     * @param columns: Hash in the form of {ColumnLabel: 'fieldName', ColumnLabel2: 'fieldName2'} (Required)
     * @param nowrap: List of column names that should have line-wrap disabled.
     * @param pageSize: the number of items per page. Default: 10
     */
    viewModel: function (params) {
        var self = this;

        self.items = CWRC.filteredData;
        self.columns = params['columns'];

        self.currentPageIndex = ko.observable(1);
        self.pageSize = params.pageSize || 20;

        self.itemsOnCurrentPage = ko.pureComputed(function () {
            var startIndex = self.pageSize * (self.currentPageIndex() - 1);

            return self.items().slice(startIndex, startIndex + self.pageSize);
        });

        self.maxPageIndex = ko.computed(function () {
            return Math.ceil(self.items().length / self.pageSize);
        });

        self.pageNeighbourhoodDistance = 1;
        self.pageNeighbourhood = ko.computed(function () {
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
ko.components.register('grid', {
    template: '<table>\
                    <!-- thead & tbody are important, otherwise the browser assumes incorrect things-->\
                    <thead>\
                        <tr>\
                            <th>\
                                Title\
                            </th>\
                            <th>\
                                Collection\
                            </th>\
                            <th>\
                                Location\
                            </th>\
                            <th>\
                                Start\
                            </th>\
                            <th>\
                                End\
                            </th>\
                        </tr>\
                    </thead>\
                    <tbody data-bind="foreach: itemsOnCurrentPage">\
                        <tr>\
                            <td data-bind="text: $data.longLabel">\
                            </td>\
                            <td data-bind="text: $data.group">\
                            </td>\
                            <td data-bind="text: $data.location">\
                            </td>\
                            <td data-bind="text: $data.startDate">\
                            </td>\
                            <td data-bind="text: $data.endDate">\
                            </td>\
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

    // Table takes:
    //      - pageSize: the number of items per page. Default: 10
    // todo: - {columnlabel: columnfield}s
    viewModel: function (params) {
        var self = this;

        self.items = CWRC.filteredData; // items is assumed to be a ko list

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

        self['setPage'] = function (index) {
            self.currentPageIndex(index);
        };

        self['isFarAway'] = function (pageIndex) {
            return self.pageNeighbourhood().indexOf(pageIndex) < 0
        }
    }
});
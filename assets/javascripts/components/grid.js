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
               <div data-bind="foreach: ko.utils.range(1, maxPageIndex)">\
                    <a href="#" data-bind="text: $data, click: function(){ $parent.setPage($data) }"></a>\
               </div>',

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
            return self.items().length / self.pageSize;
        });

        self['setPage'] = function (index) {
            self.currentPageIndex(index);
        };
    }
});
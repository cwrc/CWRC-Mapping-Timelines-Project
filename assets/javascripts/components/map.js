ko.components.register('map', {
    template: '<header>\
                    <a href="#" data-bind="click: function() { setView(\'map_view\') }, attr:{selected: isView(\'map_view\')}">\
                        Map View\
                    </a>\
                    •\
                    <a href="#" data-bind="click: function() { setView(\'list_view\') }, attr:{selected: isView(\'list_view\')}">\
                        List View\
                    </a>\
                    •\
                    <a href="#" data-bind="click: function() { setView(\'table_view\') }, attr:{selected: isView(\'table_view\')}">\
                        Grid View\
                    </a>\
               </header>\
               <section id="map_view" data-bind="visible: isView(\'map_view\')">\
                    map\
               </section>\
               <section id="list_view" data-bind="visible: isView(\'list_view\')">\
                    list\
               </section>\
               <section id="table_view" data-bind="visible: isView(\'table_view\')">\
                    <table>\
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
                    </div>\
               </section>',

    // Table takes:
    //      - pageSize: the number of items per page. Default: 10
    // todo: - {columnlabel: columnfield}s
    //
    // Map takes:
    //      -
    viewModel: function (params) {
        var self = this;

        self.items = CWRC.data; // items is assumed to be a filtered list

        // table state
        self.currentPageIndex = ko.observable(1);
        self.pageSize = params.pageSize || 20;
        self.itemsOnCurrentPage = ko.pureComputed(function () {
            var startIndex = self.pageSize * self.currentPageIndex();
            return self.items.slice(startIndex, startIndex + self.pageSize);
        });
        self.maxPageIndex = ko.computed(function () {
            return self.items().length / self.pageSize;
        });

        self['setPage'] = function (index) {
            self.currentPageIndex(index);
        };


        // map state


        self.view = ko.observable('map_view');

        self['setView'] = function (name) {
            self.view(name);
        };

        self['isView'] = function (name) {
            return self.view() == name;
        };
    }
});
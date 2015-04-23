ko.components.register('map', {
    template: '<header>\
                    <a href="" data-bind="click: function() { setView(\'map_view\') }">Map View</a>\
                    <a href="" data-bind="click: function() { setView(\'list_view\') }">List View</a>\
                    <a href="" data-bind="click: function() { setView(\'table_view\') }">Grid View</a>\
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
                        <tbody data-bind="foreach: items">\
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
               </section>',

    viewModel: function (params) {
        var self = this;

        self.view = ko.observable('map_view');
        self.items = params.items; // items is assumed to be a filtered list

        self['setView'] = function (name) {
            self.view(name);
        };

        self['isView'] = function (name) {
            return self.view() == name;
        };
    }
});
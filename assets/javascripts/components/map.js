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
                    <grid></grid>\
               </section>',

    // Map takes:
    //      -
    viewModel: function (params) {
        var self = this;

        // map state
        self.items = CWRC.filteredData; // items is assumed to be a filtered list

        // switcher state
        self.view = ko.observable('map_view');

        self['setView'] = function (name) {
            self.view(name);
        };

        self['isView'] = function (name) {
            return self.view() == name;
        };
    }
});
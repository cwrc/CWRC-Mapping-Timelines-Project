ko.components.register('switcher', {
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
                    <map params="center: \'38.479394673276445, -115.361328125\',\
                                    zoom: 3,\
                                    colorCoder: \'event-colors\',\
                                    colorKey: \'.group\',\
                                    opacity: \'0.5\',\
                                    markerWidth: 18,\
                                    markerHeight: 18">\
                    </map>\
               </section>\
               <section id="list_view" data-bind="visible: isView(\'list_view\')">\
                    <list></list>\
               </section>\
               <section id="table_view" data-bind="visible: isView(\'table_view\')">\
                    <grid></grid>\
               </section>',

    viewModel: function () {
        var self = this;

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
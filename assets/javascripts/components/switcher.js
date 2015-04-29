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
                    <!-- TODO: replace this with an actual map thingy -->\
                    <div params="latlngFormat:\'lng|lat\',\
                                    center: \'38.479394673276445, -115.361328125\',\
                                    zoom: \'3\',\
                                    colorCoder: \'event-colors\',\
                                    colorKey: \'.group\',\
                                    opacity: \'0.5\',\
                                    markerWidth: 18,\
                                    markerHeight: 18">\
                    </div>\
               </section>\
               <section id="list_view" data-bind="visible: isView(\'list_view\')">\
                    list\
               </section>\
               <section id="table_view" data-bind="visible: isView(\'table_view\')">\
                    <grid></grid>\
               </section>',

    // Map takes:
    //      -
    // TODO: handle: pins, polygons, polylines
    // TODO: make it take the ID of a div that holds the marker templates. it should force-hide that div, or maybe abduct it as the legend?
    viewModel: function (params) {
        var self = this;

        // map state
        self.items = CWRC.filteredData; // items is assumed to be a filtered list

        var mapOptions = {
            center: { lat: params.center.lat, lng: params.center.lng},
            zoom: 8
        };
        // using ID will obviously limit to one map per page, which works for now
        self.map = new google.maps.Map(document.getElementById('map_view'),
            mapOptions);


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
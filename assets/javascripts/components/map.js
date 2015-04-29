ko.components.register('map', {
    template: '<div id="map_canvas" data-bind="visible: isView(\'map_view\')">\
               </div>',

    // Map takes:
    //      -
    // TODO: handle: pins, polygons, polylines
    // TODO: make it take the ID of a div that holds the marker templates. it should force-hide that div, or maybe abduct it as the legend?
    viewModel: function (params) {
        var self = this;

        // map state
        self.items = CWRC.filteredData; // items is assumed to be a filtered list

        var mapOptions = {
            center: CWRC.Transform.parseLatLng(params.center || '49.8994, -97.1392'), // default to winnipeg
            zoom: params.zoom || 4
        };
        // using ID will obviously limit to one map per page, which works for now
        self.map = new google.maps.Map(document.getElementById('map_canvas'),
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
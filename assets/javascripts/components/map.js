ko.components.register('map', {
    template: '<div>\
                    <span data-bind="text: items().length - markers().length"></span>\
                    cannot not be plotted\
               </div>\
               <div id="map_canvas">\
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

        self['buildMarkers'] = function (item) {
            if (!item.latLng)
                return [];

            var positions = typeof item.latLng == 'string' ? [item.latLng] : item.latLng;
            var itemMarkers = [];

            for (var i = 0; i < positions.length; i++) {
                opts = {position: CWRC.Transform.parseLatLng(positions[i]), map: self.map};

                itemMarkers.push(new google.maps.Marker(opts));
            }

            return itemMarkers;
        };

        self.markers = ko.computed(function () {
            var markers = [];
            var item;
            var opts;

            for (var i = 0; i < self.items().length; i++) {
                item = self.items()[i];
                markers = markers.concat(self.buildMarkers(item));
            }

            console.log(markers.length);

            return markers;
        });
    }
});
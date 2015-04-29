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

        self.spiderfier = new OverlappingMarkerSpiderfier(self.map, {
            keepSpiderfied: true,
            spiralFootSeparation: 26, // Default: 26     # magically changes spiral size
            spiralLengthStart: 7, // 11                  # magically changes spiral size
            spiralLengthFactor: 5.75 // 4                # magically changes spiral size
        });

        self['buildMarkers'] = function (item) {
            if (!item.latLng)
                return [];

            var positions = typeof item.latLng == 'string' ? [item.latLng] : item.latLng;
            var itemMarkers = [];

            for (var i = 0; i < positions.length; i++) {
                var marker = new google.maps.Marker({
                    position: CWRC.Transform.parseLatLng(positions[i]),
                    map: self.map
                });

                itemMarkers.push(marker);

                self.spiderfier.addMarker(marker);
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

            return markers;
        });

        self.spiderfier.addListener('click', function (marker, event) {
            //TODO: set the global selection
            alert('not implemented');
        });
    }
});
ko.components.register('map', {
    template: '<div>\
                    <span data-bind="text: unplottable"></span>\
                    cannot be plotted\
               </div>\
               <div id="map_canvas">\
               </div>',

    // Map takes:
    //      -
    // TODO: handle: pins, polygons, polylines
    // TODO: make it take the ID of a div that holds the marker templates. it should force-hide that div, or maybe abduct it as the legend?
    // TODO: redraw the curently selected pin and the old pin
    viewModel: function (params) {
        var self = this;

        // map state
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

        self['buildMarkersForItem'] = function (item) {
            if (!item.latLng)
                return [];

            var positions = typeof item.latLng == 'string' ? [item.latLng] : item.latLng;
            var created = [];

            for (var i = 0; i < positions.length; i++) {
                var marker = new google.maps.Marker({
                    position: CWRC.Transform.parseLatLng(positions[i]),
                    map: self.map
                });

                created.push(marker);

                self.spiderfier.addMarker(marker);

                marker.item = item;
            }

            return created;
        };

        self.spiderfier.addListener('click', function (marker, event) {
           CWRC.selected(marker.item);
        });

        self.itemToMarkers = ko.computed(function () {
            var itemToMarkers = {};

            for (var i = 0; i < CWRC.rawData().length; i++) {
                var item = CWRC.rawData()[i];
                itemToMarkers[ko.toJSON(item)] = self.buildMarkersForItem(item);
            }

            return itemToMarkers;
        });

        self.visibleMarkers = ko.computed(function () {
            var visibleItem;
            var visibleMarkers = [];

            for (var i = 0; i < CWRC.filteredData().length; i++) {
                visibleItem = CWRC.filteredData()[i];
                var markers = self.itemToMarkers()[ko.toJSON(visibleItem)];

                visibleMarkers = visibleMarkers.concat(markers);
            }

            return visibleMarkers;
        });

        CWRC.filteredData.subscribe(function () {
            var index;
            var allMarkers = self.spiderfier.getMarkers();

            for (index = 0; index < allMarkers.length; index++) {
                allMarkers[index].setVisible(false);
            }

            for (index = 0; index < self.visibleMarkers().length; index++) {
                var visibleMarker = self.visibleMarkers()[index];

                visibleMarker.setVisible(true);
            }
        });

        self.unplottable = ko.computed(function () {
            return CWRC.filteredData().length - self.visibleMarkers().length;
        });
    }
});
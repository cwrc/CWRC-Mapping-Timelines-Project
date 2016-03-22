ko.components.register('map', {
    template: {element: 'map-template'},

    /*
     * A google map with pins at each geolocation in the data set. If there are multiple pins at the same location,
     * the stack will bear the number of pints in it. When a stack is clicked the pins will spiral out into individuals
     * for further precise selection.
     *
     * Records that have multiple locations will have all pins "linked", so that selecting one will highlight all.
     *
     * @param zoom: Zoom level as an integer number. Default: 4
     * @param center: LatLng coordinates as a string. Default: '53.5267891,-113.5270909' (University of Alberta)
     * @param colorKey: The data label to group by colour
     * @param colors: The mapping between values and their color. Keys are case-sensitive.
     *            eg. { orlandoProject: "#33ff00", multimedia: "blue"}
     * @param pinWidth: the width in pixels of a solo pin. Default: 18. (stack pins are scaled up automatically if needed)
     * @param pinHeight: the height in pixels of a solo pin. Default: 18. (stack pins are scaled up automatically if needed)
     */
    // TODO:  handle: polygons, polylines
    viewModel: function (params) {
        var self = this;

        self.isVisible = ko.observable(true);

        self.pinWidth = params['pinWidth'] || 18;
        self.pinHeight = params['pinHeight'] || 18;

        // === MAP MARKERS, PINS & POLYs ===
        self.colorTable = new CWRC.ColorTable(params.colors, params.colorKey, '#999');

        self.map = new google.maps.Map(document.getElementById('map_canvas'), {
            center: CWRC.Transform.parseLatLng(params.center || '53.5267891,-113.5270909'), // default to U of A
            zoom: params.zoom || 4
        });

        self.spiderfier = new OverlappingMarkerSpiderfier(self.map, {
            keepSpiderfied: true,     // stay open, even if a pin is selected
            spiralFootSeparation: 26, // Default: 26     # These three params will all magically change
            spiralLengthStart: 7,     // 11              # spiral size, and are freakishly
            spiralLengthFactor: 5.75  // 4               # interdependant. Good luck playing with them.
        });

        self.positionsToItemCounts = ko.computed(function () {
            var latLng, positionsToItemCounts;

            positionsToItemCounts = Object.create(null);

            CWRC.rawData().forEach(function (item) {
                latLng = item.latLng;

                if (latLng) {
                    latLng = latLng.constructor === Array ? latLng : [latLng];

                    latLng.forEach(function (pos) {
                        positionsToItemCounts[pos] = positionsToItemCounts[pos] + 1 || 1;
                    });
                }
            });

            return positionsToItemCounts;
        });

        self.buildMapTokens = function (item, map, colorTable) {
            var drawMode = item.pointType;

            if (/polygon/i.test(drawMode)) {
                return self.buildPolygonForItem(item, map, colorTable);
            } else if (/polyline|path/i.test(drawMode)) {
                return self.buildPolylineForItem(item, map, colorTable);
            } else {
                return self.buildMarkersForItem(item, map, colorTable);
            }
        };

        self.buildMarkersForItem = function (item, map, colorTable) {
            var latLng, positions, created;

            latLng = item.latLng;

            if (!item.latLng || item.latLng.length == 0)
                return [];

            // some items are single-pos, some multiple. Coerce to multi for consistency.
            positions = typeof latLng == 'string' ? [latLng] : latLng;
            created = [];

            positions.forEach(function (position) {
                var markerIcon, marker, stackSize;

                stackSize = self.positionsToItemCounts()[position];

                markerIcon = CWRC.createMarkerIcon({
                    width: self.pinWidth * (Math.pow(stackSize, 1 / 10)),
                    height: self.pinHeight * (Math.pow(stackSize, 1 / 10)),
                    color: stackSize > 1 ? colorTable.getDefaultColor() : colorTable.getColor(item),
                    label: stackSize > 1 ? stackSize : '',
                    settings: {shape: "circle"}
                });

                marker = new google.maps.Marker({
                    position: CWRC.Transform.parseLatLng(position),
                    map: map,
                    icon: markerIcon
                });

                created.push(marker);

                self.spiderfier.addMarker(marker);

                marker.item = item;
            });

            return created;
        };

        self.buildPolylineForItem = function (item, map, colorTable) {
            var coordinates, pathPts, line;

            coordinates = [];

            if (typeof item.polyline == 'string')
                pathPts = item.polyline.split('|');
            else
                pathPts = item.polyline;

            pathPts.forEach(function (point) {
                var parts = point.split(',');

                coordinates.push({lng: parseFloat(parts[0]), lat: parseFloat(parts[1])})
            });

            line = new google.maps.Polyline({
                path: coordinates,
                geodesic: true,
                strokeColor: colorTable.getColor(item),
                strokeOpacity: 1.0,
                strokeWeight: 3,
                map: map
            });

            return [line];
        };

        self.buildPolygonForItem = function (item, map, colorTable) {
            var coordinates, vertecies, shape, color;

            coordinates = [];

            if (typeof item.polygon == 'string')
                vertecies = item.polygon.split('|');
            else
                vertecies = item.polygon;

            vertecies.forEach(function (point) {
                var parts = point.split(',');

                coordinates.push({lng: parseFloat(parts[0]), lat: parseFloat(parts[1])})
            });

            color = colorTable.getColor(item);

            shape = new google.maps.Polygon({
                path: coordinates,
                geodesic: false,
                strokeColor: color,
                strokeOpacity: 1.0,
                strokeWeight: 3,
                fillColor: color,
                fillOpacity: 0.2,
                map: map
            });

            return [shape];
        };

        self.spiderfier.addListener('click', function (marker, event) {
            CWRC.selected(marker.item);
        });

        self.spiderfier.addListener('spiderfy', function (markers, event) {
            markers.forEach(function (marker) {
                marker.cwrcDefaultIcon = marker.getIcon();

                marker.setIcon(CWRC.createMarkerIcon({
                    width: self.pinWidth,
                    height: self.pinHeight,
                    color: self.colorTable.getColor(marker.item),
                    label: '',
                    settings: {shape: "circle"}
                }));
            });
        });

        self.spiderfier.addListener('unspiderfy', function (markers, event) {
            markers.forEach(function (marker) {
                marker.setIcon(marker.cwrcDefaultIcon);
            });
        });

        self.itemsToTokens = ko.computed(function () {
            var itemsToTokens = {};

            for (var i = 0; i < CWRC.rawData().length; i++) {
                var item = CWRC.rawData()[i];
                itemsToTokens[ko.toJSON(item)] = self.buildMapTokens(item, self.map, self.colorTable);
            }

            return itemsToTokens;
        });

        self.visibleMarkers = ko.computed(function () {
            var allMarkers, markers, marker, index, j, visibleData, visibleMarkers;

            allMarkers = self.spiderfier.getMarkers();

            for (index = 0; index < allMarkers.length; index++) {
                marker = allMarkers[index];

                marker.setVisible(false);
            }

            visibleData = CWRC.filteredData();
            visibleMarkers = [];

            for (index = 0; index < visibleData.length; index++) {
                var visibleItem = visibleData[index];
                markers = self.itemsToTokens()[ko.toJSON(visibleItem)];

                if (markers) {
                    for (j = 0; j < markers.length; j++) {
                        marker = markers[j];

                        marker.setVisible(true);
                        visibleMarkers.push(marker);
                    }
                }
            }

            return visibleMarkers;
        });

        self.unplottableCount = ko.pureComputed(function () {
            return CWRC.rawData().length - self.spiderfier.getMarkers().length;
        });

        self._selectedMarkers = [];
        self._itemIDToMarkers = {};
        CWRC.selected.subscribe(function () {
            var selectedItem, newSelectedMarkers;

            selectedItem = CWRC.selected();
            newSelectedMarkers = self.itemsToTokens()[ko.toJSON(selectedItem)];

            // resetting the PREVIOUS markers
            self._selectedMarkers.forEach(function (selectedMarker) {
                selectedMarker.setIcon(selectedMarker.cwrcDefaultIcon);
                selectedMarker.setZIndex(null);
            });

            self._selectedMarkers = [];

            // declared outside loop to allow panning to last one after the loop
            // panning to last (rather than pan/zoom to fit all) is easier for now
            var positions = [];

            newSelectedMarkers.forEach(function (marker) {
                // get original position if spiderfied
                if (marker._omsData) {
                    // TODO: find a way to access this data without using the mini variable name
                    positions.push(marker._omsData.l); // l because it's minified. This might break if they recompile differently.
                } else {
                    positions.push(marker.position);
                }

                marker.cwrcDefaultIcon = marker.getIcon();

                // now redraw the newly selected ones
                marker.setIcon(CWRC.createMarkerIcon({
                    width: self.pinWidth,
                    height: self.pinHeight,
                    color: self.colorTable.getColor(selectedItem),
                    label: "",
                    settings: {shape: "circle"},
                    isSelected: true
                }));
                marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
                self._selectedMarkers.push(marker);
            });


            if (
                positions.every(function (pos) {
                    return !self.map.getBounds().contains(pos);
                })
            ) {
                if (positions[0]) {
                    self.map.panTo(positions[0]);
                }
            }
        });

        // ===  Historical Map ===
        var historicalControlDiv, swBound, neBound

        swBound = new google.maps.LatLng(27.87, -181.56);
        neBound = new google.maps.LatLng(81.69, -17.58);

        self.showHistoricalMap = ko.observable(false);
        self.historicalMapOpacity = ko.observable(0.6);
        self.historicalOverlay = new google.maps.GroundOverlay(
            'assets/images/maps/BNA_1854.png',
            new google.maps.LatLngBounds(swBound, neBound),
            {opacity: self.historicalMapOpacity()}
        );

        historicalControlDiv = document.getElementById('historicalMapControls');
        historicalControlDiv.id = 'cwrc_historical_map_control';
        historicalControlDiv.index = 1;

        self.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(historicalControlDiv);

        self['toggleHistoricalMap'] = function () {
            self.showHistoricalMap(!self.showHistoricalMap());
        };

        self.showHistoricalMap.subscribe(function (isShown) {
            if (isShown) {
                self.historicalOverlay.setMap(self.map);
            } else {
                self.historicalOverlay.setMap(null);
            }
        });

        self.historicalMapOpacity.subscribe(function (opacity) {
            self.historicalOverlay.setOpacity(Number(opacity));
        });
    }
});

// === COLOR MAP ===
CWRC.ColorTable = function (mapping, colorKey, defaultColor) {
    this.mapping = mapping || {};
    this.colorKey = colorKey;
    this.defaultColor = defaultColor;
};

CWRC.ColorTable.prototype.hasMapping = function () {
    return !!this.colorKey;
};

CWRC.ColorTable.prototype.getColor = function (selectedItem) {
    return (this.mapping[selectedItem[this.colorKey]]) || this.defaultColor;
};

CWRC.ColorTable.prototype.getDefaultColor = function (selectedItem) {
    return this.defaultColor;
};

CWRC.ColorTable.prototype.getLegendPairs = function () {
    var colorPairs, field;

    colorPairs = [];

    for (field in this.mapping) {
        colorPairs.push({
                name: field,
                icon: CWRC.createMarkerIcon({
                    width: 14,
                    height: 14,
                    color: this.mapping[field],
                    label: "",
                    settings: {shape: "circle"}
                }).url
            }
        )
    }

    return colorPairs;
};
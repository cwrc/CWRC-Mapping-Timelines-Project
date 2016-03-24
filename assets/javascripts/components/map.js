ko.components.register('map', {
    template: {element: 'map-template'},

    /*
     * A google map with tokens (pins, polylines, or polygons) at each geolocation in the data set.
     *
     * Pin Stacking
     * If there are multiple pin tokens at the same location, the stack will bear the number of pins in it. When a
     * stack is clicked the pins will spiral out into individuals for further precise selection.
     *
     * Records that have multiple locations have all pins "linked", so that selecting one will highlight all.
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
            var latLng, positions, createdMarkers;

            latLng = item.latLng;

            if (!item.latLng || item.latLng.length == 0)
                return [];

            // some items are single-pos, some multiple. Coerce to multi for consistency.
            positions = typeof latLng == 'string' ? [latLng] : latLng;
            createdMarkers = [];

            positions.forEach(function (positionString) {
                var plainIcon, stackedIcon, selectedIcon, marker, stackSize, position, color;

                stackSize = self.positionsToItemCounts()[positionString];

                color = colorTable.getColor(item);

                plainIcon = CWRC.createMarkerIcon({
                    width: self.pinWidth,
                    height: self.pinHeight,
                    color: self.colorTable.getColor(item),
                    label: '',
                    settings: {shape: "circle"}
                });

                stackedIcon = CWRC.createMarkerIcon({
                    width: self.pinWidth * (Math.pow(stackSize, 1 / 10)),
                    height: self.pinHeight * (Math.pow(stackSize, 1 / 10)),
                    color: stackSize > 1 ? colorTable.getDefaultColor() : color,
                    label: stackSize > 1 ? stackSize : '',
                    settings: {shape: 'circle'}
                });

                selectedIcon = CWRC.createMarkerIcon({
                    width: self.pinWidth,
                    height: self.pinHeight,
                    color: color,
                    label: '',
                    settings: {shape: 'circle'},
                    isSelected: true
                });

                position = CWRC.Transform.parseLatLng(positionString);

                marker = new google.maps.Marker({
                    position: position,
                    map: map,
                    icon: stackedIcon
                });

                createdMarkers.push(marker);

                self.spiderfier.addMarker(marker);

                marker.cwrc = {
                    item: item,
                    originalPosition: position,
                    stackedIcon: stackedIcon,
                    selectedIcon: selectedIcon,
                    plainIcon: plainIcon,
                    selected: false
                };
            });

            return createdMarkers;
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
                strokeOpacity: 1.0,
                map: map
            });

            line.cwrc = {
                item: item,
                plainDrawingOptions: {
                    strokeColor: colorTable.getColor(item),
                    strokeWeight: 2
                },
                selectedDrawingOptions: {
                    strokeColor: '#FF0000',
                    strokeWeight: 3
                },
                selected: false
            };

            line.setOptions(line.cwrc.plainDrawingOptions);

            line.addListener('click', function (event) {
                CWRC.selected(item);
            });

            return [line];
        };

        self.buildPolygonForItem = function (item, map, colorTable) {
            var coordinates, vertecies, shape, plainColor;

            coordinates = [];

            if (typeof item.polygon == 'string')
                vertecies = item.polygon.split('|');
            else
                vertecies = item.polygon;

            vertecies.forEach(function (vertexString) {
                var vertexParts = vertexString.split(',');

                coordinates.push({
                    lng: parseFloat(vertexParts[0]),
                    lat: parseFloat(vertexParts[1])
                })
            });

            plainColor = colorTable.getColor(item);

            shape = new google.maps.Polygon({
                path: coordinates,
                geodesic: false,
                map: map,
                fillColor: plainColor,
                fillOpacity: 0.2,
                strokeOpacity: 1.0
            });

            shape.cwrc = {
                item: item,
                plainDrawingOptions: {
                    strokeColor: plainColor,
                    strokeWeight: 2
                },
                selectedDrawingOptions: {
                    strokeColor: '#FF0000',
                    strokeWeight: 3
                },
                selected: false
            };

            shape.addListener('click', function (event) {
                CWRC.selected(item);
            });

            shape.setOptions(shape.cwrc.plainDrawingOptions);

            return [shape];
        };

        self.spiderfier.addListener('click', function (marker, event) {
            CWRC.selected(marker.cwrc.item);
        });

        self.spiderfier.addListener('spiderfy', function (markers, event) {
            markers.forEach(function (marker) {
                var icon;

                marker.cwrc.spiderfied = true;

                if (marker.cwrc.selected)
                    icon = marker.cwrc.selectedIcon;
                else if (marker.cwrc.spiderfied)
                    icon = marker.cwrc.plainIcon;
                else
                    icon = marker.cwrc.stackedIcon;


                marker.setIcon(icon);
            });
        });

        self.spiderfier.addListener('unspiderfy', function (markers, event) {
            markers.forEach(function (marker) {
                var icon;

                marker.cwrc.spiderfied = false;

                if (marker.cwrc.selected)
                    icon = marker.cwrc.selectedIcon;
                else if (marker.cwrc.spiderfied)
                    icon = marker.cwrc.plainIcon;
                else
                    icon = marker.cwrc.stackedIcon;


                marker.setIcon(icon);
            });
        });

        self.itemsToTokens = ko.computed(function () {
            var map = CWRC.rawData().reduce(function (aggregate, item) {
                aggregate[ko.toJSON(item)] = self.buildMapTokens(item, self.map, self.colorTable);
                return aggregate;
            }, {});

            return new CWRC.Map.ItemTokenMapper(map);
        });

        // Not an actual display property.
        // It's a computed to allow it to observe both CWRC.filteredData and self.itemsToTokens
        self.visibleTokens = ko.computed(function () {
            var allTokens, visibleTokens, itemsToTokens;

            itemsToTokens = self.itemsToTokens();

            allTokens = itemsToTokens.getAllTokens();
            allTokens.forEach(function (token) {
                token.setVisible(false);
            });

            visibleTokens = itemsToTokens.getTokens(CWRC.filteredData());
            visibleTokens.forEach(function (token) {
                token.setVisible(true);
            });

            return visibleTokens;
        });

        self.unplottableCount = ko.pureComputed(function () {
            return CWRC.rawData().length - self.spiderfier.getMarkers().length;
        });

        self._selectedTokens = [];
        self._itemIDToMarkers = {};
        CWRC.selected.subscribe(function () {
            var selectedItem, newSelectedTokens, isOffCamera, positions;

            selectedItem = CWRC.selected();
            newSelectedTokens = self.itemsToTokens().getTokens(selectedItem);

            // resetting the PREVIOUS markers
            self._selectedTokens.forEach(function (token) {
                var icon;

                // TODO: refactor this into a setSelected(false) method on Marker, Polygon, and Polyline
                if (token instanceof google.maps.Polygon) {
                    token.setOptions(token.cwrc.plainDrawingOptions);
                } else if (token instanceof google.maps.Polyline) {
                    token.setOptions(token.cwrc.plainDrawingOptions);
                } else { // Marker
                    token.cwrc.selected = false;

                    if (token.cwrc.spiderfied)
                        icon = token.cwrc.plainIcon;
                    else
                        icon = token.cwrc.stackedIcon;

                    token.setIcon(icon);
                    token.setZIndex(null);
                }

                // token.setSelected(false)
            });

            self._selectedTokens = [];

            positions = [];

            newSelectedTokens.forEach(function (token) {
                // TODO: refactor this into a setSelected(true) method on Marker, Polygon, and Polyline
                if (token instanceof google.maps.Polygon) {
                    token.setOptions(token.cwrc.selectedDrawingOptions);

                    token.getPaths().forEach(function (path) {
                        path.forEach(function (point) {
                            positions.push(point);
                        })
                    });
                } else if (token instanceof google.maps.Polyline) {
                    token.setOptions(token.cwrc.selectedDrawingOptions);

                    token.getPath().forEach(function (point) {
                        positions.push(point);
                    });
                } else { // it's a Marker
                    positions.push(token.cwrc.originalPosition);

                    // now redraw the newly selected ones
                    token.setIcon(token.cwrc.selectedIcon);
                    token.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
                }

                token.cwrc.selected = true;

                // token.setSelected(true)

                self._selectedTokens.push(token);
            });

            isOffCamera = positions.every(function (pos) {
                return !self.map.getBounds().contains(pos);
            });

            // Panning (rather than pan & zoom to fit all) is easier for now
            if (isOffCamera && positions[0])
                self.map.panTo(positions[0]);
        });

        // ===  Historical Map ===
        var historicalControlDiv, swBound, neBound;

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

CWRC.Map = CWRC.Map || {};


// === Token Mapper ===
CWRC.Map.ItemTokenMapper = function (itemsToTokens) {
    this.itemsToTokens = itemsToTokens;
};

CWRC.Map.ItemTokenMapper.prototype.getTokens = function (items) {
    var itemsToTokens, values;

    itemsToTokens = this.itemsToTokens;

    if (!(items instanceof Array))
        items = [items];

    values = items.map(function (item) {
        if (!(typeof item == 'string'))
            item = ko.toJSON(item);

        return itemsToTokens[item];
    });

    // smoosh the array of arrays flat.
    return values.reduce(function (aggregate, tokenList) {
        return tokenList ? aggregate.concat(tokenList) : aggregate;
    }, []);
};

CWRC.Map.ItemTokenMapper.prototype.getAllTokens = function () {
    return this.getTokens(Object.keys(this.itemsToTokens))
};


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
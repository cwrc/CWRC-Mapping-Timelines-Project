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

        self.tokenBuilder = new CWRC.Map.TokenBuilder({
            colorTable: self.colorTable,
            pin: {
                width: self.pinWidth,
                height: self.pinHeight,
                spiderfier: self.spiderfier
            }
        });

        self.getPoints = function (token) {
            var positions = [];

            if (token instanceof google.maps.Polygon) {
                token.getPaths().forEach(function (path) {
                    path.forEach(function (point) {
                        positions.push(point);
                    })
                });
            } else if (token instanceof google.maps.Polyline) {
                token.getPath().forEach(function (point) {
                    positions.push(point);
                });
            } else { // it's a Marker
                positions.push(token.cwrc.originalPosition);
            }

            return positions;
        }

        self.setSelected = function (token, isSelected) {
            var icon;

            token.cwrc.selected = isSelected;

            if (isSelected) {
                if (token instanceof google.maps.Polygon) {
                    token.setOptions(token.cwrc.selectedDrawingOptions);
                } else if (token instanceof google.maps.Polyline) {
                    token.setOptions(token.cwrc.selectedDrawingOptions);
                } else { // it's a Marker
                    token.setIcon(token.cwrc.selectedIcon);
                    token.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
                }
            } else {
                if (token instanceof google.maps.Polygon) {
                    token.setOptions(token.cwrc.plainDrawingOptions);
                } else if (token instanceof google.maps.Polyline) {
                    token.setOptions(token.cwrc.plainDrawingOptions);
                } else { // Marker
                    if (token.cwrc.spiderfied)
                        icon = token.cwrc.plainIcon;
                    else
                        icon = token.cwrc.stackedIcon;

                    token.setIcon(icon);
                    token.setZIndex(null);
                }
            }
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
            // TODO: refactor this into the constructor after the buildToken methods are extracted
            var map = CWRC.rawData().reduce(function (aggregate, item) {
                aggregate[ko.toJSON(item)] = self.tokenBuilder.buildMapTokens(item);
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
        CWRC.selected.subscribe(function () {
            var selectedItem, newSelectedTokens, bounds, pointCount;

            selectedItem = CWRC.selected();
            newSelectedTokens = self.itemsToTokens().getTokens(selectedItem);

            // resetting the PREVIOUS markers
            self._selectedTokens.forEach(function (token) {
                self.setSelected(token, false)
            });

            self._selectedTokens = [];

            pointCount = 0;
            bounds = new google.maps.LatLngBounds();

            newSelectedTokens.forEach(function (token) {
                self.getPoints(token).forEach(function (position) {
                    bounds.extend(position);
                    pointCount++;
                });
                self.setSelected(token, true);

                self._selectedTokens.push(token);
            });

            // using two separate behaviours because fitBounds on a point zooms in far too much
            if (pointCount > 1)
                self.map.fitBounds(bounds);
            else if (pointCount > 0)
                self.map.panTo(bounds.getCenter());
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


// === Token Builder ===

/**
 * Constucts a new Token Builder.
 *
 * @param params A options object with the following properties:
 *   {colorTable: table,
 *    map: the map tokens are placed on
 *    pin: {
 *          spiderfier: the spiderfier used to lay out pins
 *          width: the default width of a pin,
 *          height: the default height of a pin
 *         }
 *   }
 *
 * @constructor
 */
CWRC.Map.TokenBuilder = function (params) {
    this.colorTable = params.colorTable;
    this.map = params.map || params.pin.spiderfier.map;

    this.spiderfier = params.pin.spiderfier;

    this.pinWidth = params.pin.width;
    this.pinHeight = params.pin.height;

    this.positionsToItemCounts = ko.computed(function () {
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
};

/**
 * Constructs one or more map tokens (Marker pin, Polyline path, or Polygon area) from the data in the given item.
 *
 * @param item A data record.
 * @param map
 * @param colorTable
 */
CWRC.Map.TokenBuilder.prototype.buildMapTokens = function (item) {
    var drawMode = item.pointType;

    if (/polygon/i.test(drawMode)) {
        return this.buildPolygonForItem(item);
    } else if (/polyline|path/i.test(drawMode)) {
        return this.buildPolylineForItem(item);
    } else {
        return this.buildMarkersForItem(item);
    }
};

CWRC.Map.TokenBuilder.prototype.buildMarkersForItem = function (item) {
    var latLng, positions, createdMarkers;

    var self = this;

    latLng = item.latLng;

    if (!item.latLng || item.latLng.length == 0)
        return [];

    // some items are single-pos, some multiple. Coerce to multi for consistency.
    positions = typeof latLng == 'string' ? [latLng] : latLng;
    createdMarkers = [];

    positions.forEach(function (positionString) {
        var plainIcon, stackedIcon, selectedIcon, marker, stackSize, position, color;

        stackSize = self.positionsToItemCounts()[positionString];

        color = self.colorTable.getColor(item);

        plainIcon = CWRC.createMarkerIcon({
            width: self.pinWidth,
            height: self.pinHeight,
            color: color,
            label: '',
            settings: {shape: "circle"}
        });

        stackedIcon = CWRC.createMarkerIcon({
            width: self.pinWidth * (Math.pow(stackSize, 1 / 10)),
            height: self.pinHeight * (Math.pow(stackSize, 1 / 10)),
            color: stackSize > 1 ? self.colorTable.getDefaultColor() : color,
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
            map: self.map,
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

//CWRC.Map.TokenBuilder.prototype.buildMarkersForPosition = function (item) {
//    var latLng, positions, createdMarkers;
//
//    var self = this;
//
//    latLng = item.latLng;
//
//    if (!item.latLng || item.latLng.length == 0)
//        return [];
//
//    // some items are single-pos, some multiple. Coerce to multi for consistency.
//    positions = typeof latLng == 'string' ? [latLng] : latLng;
//    createdMarkers = [];
//
//    positions.forEach(function (positionString) {
//        var plainIcon, stackedIcon, selectedIcon, marker, stackSize, position, color;
//
//        stackSize = self.positionsToItemCounts()[positionString];
//
//        color = self.colorTable.getColor(item);
//
//        plainIcon = CWRC.createMarkerIcon({
//            width: self.pinWidth,
//            height: self.pinHeight,
//            color: color,
//            label: '',
//            settings: {shape: "circle"}
//        });
//
//        stackedIcon = CWRC.createMarkerIcon({
//            width: self.pinWidth * (Math.pow(stackSize, 1 / 10)),
//            height: self.pinHeight * (Math.pow(stackSize, 1 / 10)),
//            color: stackSize > 1 ? self.colorTable.getDefaultColor() : color,
//            label: stackSize > 1 ? stackSize : '',
//            settings: {shape: 'circle'}
//        });
//
//        selectedIcon = CWRC.createMarkerIcon({
//            width: self.pinWidth,
//            height: self.pinHeight,
//            color: color,
//            label: '',
//            settings: {shape: 'circle'},
//            isSelected: true
//        });
//
//        position = CWRC.Transform.parseLatLng(positionString);
//
//        marker = new google.maps.Marker({
//            position: position,
//            map: self.map,
//            icon: stackedIcon
//        });
//
//        createdMarkers.push(marker);
//
//        self.spiderfier.addMarker(marker);
//
//        marker.cwrc = {
//            item: item,
//            originalPosition: position,
//            stackedIcon: stackedIcon,
//            selectedIcon: selectedIcon,
//            plainIcon: plainIcon,
//            selected: false
//        };
//    });
//
//    return createdMarkers;
//};

CWRC.Map.TokenBuilder.prototype.buildPolylineForItem = function (item) {
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
        map: this.map
    });

    line.cwrc = {
        item: item,
        plainDrawingOptions: {
            strokeColor: this.colorTable.getColor(item),
            strokeWeight: 2
        },
        selectedDrawingOptions: {
            strokeColor: '#FF0000',
            strokeWeight: 3
        },
        selected: false,
        setSelected: function (isSelected) {

        }
    };

    line.setOptions(line.cwrc.plainDrawingOptions);

    line.addListener('click', function (event) {
        CWRC.selected(item);
    });

    return [line];
};

CWRC.Map.TokenBuilder.prototype.buildPolygonForItem = function (item) {
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

    plainColor = this.colorTable.getColor(item);

    shape = new google.maps.Polygon({
        path: coordinates,
        geodesic: false,
        map: this.map,
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
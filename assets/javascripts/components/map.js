ko.components.register('atlas', {
    template: {element: 'atlas-template'},

    /*
     * A google map with tokens (pins, polylines, or polygons) at each geolocation in the data set.
     *
     * Named Atlas as opposed to Map to avoid name conflict within Knockout, and to help distinguish between the component
     * and its controlled Google map.
     *
     * Pin Stacking
     * If there are multiple pin tokens at the same location, the stack will bear the number of pins in it. When a
     * stack is clicked the pins will spiral out into individuals for further precise selection.
     *
     * Records that have multiple locations have all pins "linked", so that selecting one will highlight all.
     *
     * @param zoom: Initial zoom level as an integer number. Default: 4
     * @param center: LatLng coordinates as a string. Default: '53.5267891,-113.5270909' (University of Alberta)
     * @param colorKey: The data label to group by colour
     * @param colors: The mapping between values and their color. Keys are case-sensitive.
     *            eg. { orlandoProject: "#33ff00", multimedia: "blue"}
     * @param pinWidth: the width in pixels of a solo pin. Default: 18. (stack pins are scaled up automatically if needed)
     * @param pinHeight: the height in pixels of a solo pin. Default: 18. (stack pins are scaled up automatically if needed)
     */
    viewModel: function (params) {
        var self = this;

        self.isVisible = ko.observable(true);
        self.canvasHeight = ko.observable();

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

        self.spiderfier.addListener('click', function (marker, event) {
            CWRC.selected(marker.cwrc.item);
        });

        self.spiderfier.addListener('spiderfy', function (markers, event) {
            markers.forEach(function (marker) {
                marker.cwrc.spiderfied(true);
            });
        });

        self.spiderfier.addListener('unspiderfy', function (markers, event) {
            markers.forEach(function (marker) {
                marker.cwrc.spiderfied(false);
            });
        });

        self.itemsToTokens = ko.computed(function () {
            return new CWRC.Map.ItemTokenMapper(new CWRC.Map.TokenBuilder({
                colorTable: self.colorTable,
                pin: {
                    width: params['pinWidth'] || CWRC.Map.DEFAULT_PIN_WIDTH,
                    height: params['pinHeight'] || CWRC.Map.DEFAULT_PIN_HEIGHT,
                    spiderfier: self.spiderfier
                }
            }));
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
            return CWRC.rawData().length - self.itemsToTokens().getAllTokens().length;
        });

        self._selectedTokens = [];
        CWRC.selected.subscribe(function () {
            var newSelectedTokens, bounds, pointCount, withinViewport;

            newSelectedTokens = self.itemsToTokens().getTokens(CWRC.selected());

            // resetting the PREVIOUS markers
            self._selectedTokens.forEach(function (token) {
                token.cwrc.selected(false)
            });

            self._selectedTokens = [];

            pointCount = 0;
            bounds = new google.maps.LatLngBounds();

            newSelectedTokens.forEach(function (token) {
                token.cwrc.getPoints().forEach(function (position) {
                    bounds.extend(position);
                    pointCount++;
                });
                token.cwrc.selected(true);

                self._selectedTokens.push(token);
            });

            withinViewport = self.map.getBounds().contains(bounds.getNorthEast()) &&
                self.map.getBounds().contains(bounds.getSouthWest());

            // using two separate behaviours because fitBounds(singlePoint) zooms in far too much
            if (pointCount > 0 && !withinViewport)
                pointCount > 1 ? self.map.fitBounds(bounds) : self.map.panTo(bounds.getCenter());
        });

        // ===  Historical Map ===
        var historicalControlDiv;

        var tmpOverlays = [
            {
                label: 'BNA 1854',
                uri: 'assets/images/maps/BNA_1854.png',
                swBound: new google.maps.LatLng(27.87, -181.56),
                neBound: new google.maps.LatLng(81.69, -17.58)
            },
            {
                label: 'BNA 1854 Negative',
                uri: 'assets/images/maps/BNA_1854_neg.png',
                swBound: new google.maps.LatLng(27.87, -181.56),
                neBound: new google.maps.LatLng(81.69, -17.58)
            }
        ];

        self.getOverlayName = function (googleOverlay) {
            return tmpOverlays.find(function (overlay) {
                return googleOverlay.getUrl() == overlay.uri;
            }).label;
        };

        self.showHistoricalMap = ko.observable(false);
        self.historicalMapOpacity = ko.observable(0.6);
        self.overlays = ko.observableArray(tmpOverlays.map(function (overlayData) {
            return new google.maps.GroundOverlay(
                overlayData.uri,
                new google.maps.LatLngBounds(overlayData.swBound, overlayData.neBound),
                {opacity: self.historicalMapOpacity()}
            )
        }));
        self.selectedOverlay = ko.observable(self.overlays()[0]);

        historicalControlDiv = document.getElementById('historicalMapControls');
        historicalControlDiv.id = 'cwrc_historical_map_control';
        historicalControlDiv.index = 1;

        self.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(historicalControlDiv);

        self['toggleHistoricalMap'] = function () {
            self.showHistoricalMap(!self.showHistoricalMap());
        };

        self.showHistoricalMap.subscribe(function (isShown) {
            if (isShown) {
                self.selectedOverlay().setMap(self.map);
            } else {
                self.selectedOverlay().setMap(null);
            }
        });

        self.selectedOverlay.subscribe(function (newSelected) {
            self.overlays().forEach(function (overlay) {
                if (overlay !== newSelected) {
                    overlay.setMap(null);
                }
            });

            newSelected.setMap(self.map);
        });

        self.historicalMapOpacity.subscribe(function (opacity) {
            self.selectedOverlay().setOpacity(Number(opacity));
        });
    }
});

CWRC.Map = CWRC.Map || {};

CWRC.Map.DEFAULT_PIN_HEIGHT = CWRC.Map.DEFAULT_PIN_WIDTH = 18;


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
 */
CWRC.Map.TokenBuilder.prototype.buildTokens = function (item) {
    var drawMode = item.pointType;

    if (/polygon/i.test(drawMode)) {
        return this.buildPolygonForItem(item);
    } else if (/polyline|path/i.test(drawMode)) {
        return this.buildPolylineForItem(item);
    } else {
        return this.buildMarkersForItem(item);
    }
};

/**
 * Builds one or more map Marker tokens and returns them in an array. See buildToken for details on Markers.
 *
 * @param item The data record to be represented on the map.
 * @returns {Array} The Markers for the given item.
 */
CWRC.Map.TokenBuilder.prototype.buildMarkersForItem = function (item) {
    var latLng, positions, createdMarkers, stackSize, position;

    var self = this;

    latLng = item.latLng;

    if (!item.latLng || item.latLng.length == 0)
        return [];

    // some items are single-pos, some multiple. Coerce to multi for consistency.
    positions = typeof latLng == 'string' ? [latLng] : latLng;
    createdMarkers = [];

    positions.forEach(function (positionString) {
        stackSize = self.positionsToItemCounts()[positionString];

        position = CWRC.Transform.parseLatLng(positionString);

        createdMarkers.push(self.buildMarker(position, item, stackSize, self.spiderfier));
    });

    return createdMarkers;
};

/**
 * Builds a Marker token at the given position to represent the given item. The Marker is constructed with a .cwrc
 * subfield that packages together all additional cwrc custom information.
 *
 * Dev note: The .cwrc field exists because current requirements do not yet warrant the copious boilerplate of full JS
 * subclasses.
 *
 * @param position Object with properties lat and lng, both integers of their geocoordinates.
 * @param item The data record to link this marker to.
 * @param stackSize The total number of items with the same position
 * @param spiderfier The spiderfier to use for layout on the map.
 * @returns {google.maps.Marker|*} The constructed Marker.
 */
CWRC.Map.TokenBuilder.prototype.buildMarker = function (position, item, stackSize, spiderfier) {
    var plainIcon, stackedIcon, selectedIcon, marker, color;

    color = this.colorTable.getColor(item);

    plainIcon = CWRC.createMarkerIcon({
        width: this.pinWidth,
        height: this.pinHeight,
        color: color,
        label: '',
        settings: {shape: "circle"}
    });

    stackedIcon = CWRC.createMarkerIcon({
        width: this.pinWidth * (Math.pow(stackSize, 1 / 10)),
        height: this.pinHeight * (Math.pow(stackSize, 1 / 10)),
        color: stackSize > 1 ? this.colorTable.getDefaultColor() : color,
        label: stackSize > 1 ? stackSize : '',
        settings: {shape: 'circle'}
    });

    selectedIcon = CWRC.createMarkerIcon({
        width: this.pinWidth,
        height: this.pinHeight,
        color: color,
        label: '',
        settings: {shape: 'circle'},
        isSelected: true
    });

    marker = new google.maps.Marker({
        position: position,
        map: this.map
    });

    marker.cwrc = {
        item: item,
        originalPosition: position,
        selected: ko.observable(false),
        spiderfied: ko.observable(false),
        getPoints: function () {
            return [position];
        }
    };

    marker.cwrc.updateIcon = ko.computed(function () {
        var isSelected = marker.cwrc.selected();
        var isSpiderfied = marker.cwrc.spiderfied();

        if (isSelected) {
            marker.setIcon(selectedIcon);
            marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);

        } else {
            marker.setZIndex(null);

            if (isSpiderfied)
                marker.setIcon(plainIcon);
            else
                marker.setIcon(stackedIcon); // not selected && not spiderfied
        }
    });

    marker.cwrc.selected(false);
    marker.cwrc.spiderfied(false);

    spiderfier.addMarker(marker);

    return marker;
};

/**
 * Builds a Polyline path token to represent the given item. The Polyline contains a .cwrc subfield that packages
 * together all additional cwrc custom information.
 *
 * Dev note: The .cwrc field exists because current requirements do not yet warrant the copious boilerplate of full JS
 * subclasses.
 *
 * @param item The data record to link this line to.
 * @returns {*[]} The constructed Polyline
 */
CWRC.Map.TokenBuilder.prototype.buildPolylineForItem = function (item) {
    var coordinates, pathPts, line, color, pointParts;

    color = this.colorTable.getColor(item);
    coordinates = [];

    pathPts = (typeof item.polyline == 'string') ? item.polyline.split('|') : item.polyline;

    pathPts.forEach(function (point) {
        pointParts = point.split(',');

        coordinates.push({lng: parseFloat(pointParts[0]), lat: parseFloat(pointParts[1])})
    });

    line = new google.maps.Polyline({
        path: coordinates,
        geodesic: true,
        strokeOpacity: 1.0,
        map: this.map
    });

    line.cwrc = {
        item: item,
        selected: ko.observable(),
        getPoints: function () {
            return line.getPath();
        }
    };

    line.cwrc.selected.subscribe(function (isSelected) {
        line.setOptions({
            strokeColor: isSelected ? '#CC0000' : color,
            strokeWeight: isSelected ? 3 : 2
        });
    });
    line.cwrc.selected(false); // set default and trigger listener

    line.addListener('click', function (event) {
        CWRC.selected(item);
    });

    return [line];
};

/**
 * Builds a Polygon shape token to represent the given item. The Polygon contains a .cwrc subfield that packages
 * together all additional cwrc custom information.
 *
 * Dev note: The .cwrc field exists because current requirements do not yet warrant the copious boilerplate of full JS
 * subclasses.
 *
 * @param item The data record to link this line to.
 * @returns {*[]} The constructed Polygon
 */
CWRC.Map.TokenBuilder.prototype.buildPolygonForItem = function (item) {
    var coordinates, vertecies, vertexParts, shape, plainColor;

    coordinates = [];

    vertecies = (typeof item.polygon == 'string') ? item.polygon.split('|') : item.polygon;

    vertecies.forEach(function (vertexString) {
        vertexParts = vertexString.split(',');

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
        selected: ko.observable(),
        getPoints: function () {
            var positions = [];

            shape.getPaths().forEach(function (path) {
                positions = positions.concat(path.getArray());
            });

            return positions;
        }
    };

    shape.cwrc.selected.subscribe(function (isSelected) {
        shape.setOptions({
            strokeColor: isSelected ? '#FF0000' : plainColor,
            strokeWeight: isSelected ? 3 : 2
        });
    });
    shape.cwrc.selected(false); // set default and trigger listener

    shape.addListener('click', function (event) {
        CWRC.selected(item);
    });

    return [shape];
};


// === Token Mapper ===
/**
 * Constructs a new token mapper.
 *
 * @param tokenBuilder The builder object to be used for constructing tokens
 * @constructor
 */
CWRC.Map.ItemTokenMapper = function (tokenBuilder) {
    this.itemsToTokens = CWRC.rawData().reduce(function (aggregate, item) {
        aggregate[ko.toJSON(item)] = tokenBuilder.buildTokens(item);
        return aggregate;
    }, {});
};


/**
 * Gets the tokens mapped to the given item, or item list.
 *
 * @param items An array of items or a single item.
 * @returns Array of map tokens for the given item.
 */
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


/**
 * Returns all tokens for all items.
 *
 * @returns {Array}
 */
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

CWRC.ColorTable.prototype.getColor = function (item) {
    return (this.mapping[item[this.colorKey]]) || this.defaultColor;
};

CWRC.ColorTable.prototype.getDefaultColor = function (item) {
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
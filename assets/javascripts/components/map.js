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
        self.colorMap = new CWRC.ColorMap(params.colors, params.colorKey, "#999");

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


        self['buildMarkersForItem'] = function (item) {
            var latLng, positions, created;

            latLng = item.latLng;

            if (!item.latLng)
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
                    color: self.colorMap.getColor(item),
                    label: stackSize > 1 ? stackSize : '',
                    settings: {shape: "circle"}
                });

                marker = new google.maps.Marker({
                    position: CWRC.Transform.parseLatLng(position),
                    map: self.map,
                    icon: markerIcon
                });

                created.push(marker);

                self.spiderfier.addMarker(marker);

                marker.item = item;
            });

            return created;
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
                    color: self.colorMap.getColor(marker.item),
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

        self.itemToMarkers = ko.computed(function () {
            var itemToMarkers = {};

            for (var i = 0; i < CWRC.rawData().length; i++) {
                var item = CWRC.rawData()[i];
                itemToMarkers[ko.toJSON(item)] = self.buildMarkersForItem(item);
            }

            return itemToMarkers;
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
                markers = self.itemToMarkers()[ko.toJSON(visibleItem)];

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
            newSelectedMarkers = self.itemToMarkers()[ko.toJSON(selectedItem)];

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
                    color: self.colorMap.getColor(selectedItem),
                    label: "",
                    settings: {shape: "circle"},
                    isSelected: true
                }));
                marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
                self._selectedMarkers.push(marker);
            });


            if (positions.every(function (pos) {
                    return !self.map.getBounds().contains(pos);
                })
            ) {
                self.map.panTo(positions[0]);
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

// TODO: extract to a helper lib
CWRC.createMarkerIcon = function (params) {
    var width, height, color, label, settings, isSelected;

    width = params['width'] || 18;
    height = params['height'] || 18;
    color = params['color'];
    label = params['label'];
    settings = params['settings'];
    isSelected = params['isSelected'];

    // TODO: might be faster to store in a hash, if possible

    var drawShadow = function (icon) {
        var width, heeight, shadowWidth, canvas, context;

        width = icon.width;
        height = icon.height;
        shadowWidth = width + height;

        canvas = document.createElement("canvas");
        canvas.width = shadowWidth;
        canvas.height = height;

        context = canvas.getContext("2d");
        context.scale(1, 1 / 2);
        context.translate(height / 2, height);
        context.transform(1, 0, -1 / 2, 1, 0, 0);
        context.fillRect(0, 0, width, height);
        context.globalAlpha = settings.shapeAlpha;
        context.globalCompositeOperation = "destination-in";
        context.drawImage(icon, 0, 0);
        return canvas;
    };
    // TODO: check all these
    var pin = true; //settings.pin;
    var pinWidth = width / 3; // settings.pinWidth;
    var pinHeight = height / 3; // settings.pinHeight;
    var lineWidth = isSelected ? 4 : 1;
    var lineColor = settings.borderColor || "black";
    var alpha = 1.0; //settings.shapeAlpha;
    var bodyWidth = width - lineWidth;
    var bodyHeight = height - lineWidth;
    var markerHeight = height + (pin ? pinHeight : 0) + lineWidth;
    var radius;
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = markerHeight;
    if (isSelected)
        canvas.z_index = 999;

    var context = canvas.getContext("2d");
    context.clearRect(0, 0, width, markerHeight);
    context.beginPath();

    if (settings && (settings.shape == "circle")) {
        radius = bodyWidth / 2;
        if (!pin) {
            context.arc(width / 2, height / 2, radius, 0, 2 * Math.PI);
        } else {
            var meetAngle = Math.atan2(pinWidth / 2, bodyHeight / 2);
            context.arc(width / 2, height / 2, radius, Math.PI / 2 + meetAngle, Math.PI / 2 - meetAngle);
            context.lineTo(width / 2, height + pinHeight - lineWidth / 2);
        }
    } else {
        radius = bodyWidth / 4;
        var topY = leftX = lineWidth / 2;
        var botY = height - lineWidth / 2;
        var rightX = width - lineWidth / 2;
        context.moveTo(rightX - radius, topY);
        context.arcTo(rightX, topY, rightX, topY + radius, radius);
        context.lineTo(rightX, botY - radius);
        context.arcTo(rightX, botY, rightX - radius, botY, radius);
        if (pin) {
            context.lineTo(width / 2 + pinWidth / 2, botY);
            context.lineTo(width / 2, height + pinHeight - lineWidth / 2);
            context.lineTo(width / 2 - pinWidth / 2, botY);
        }
        context.lineTo(leftX + radius, botY);
        context.arcTo(leftX, botY, leftX, botY - radius, radius);
        context.lineTo(leftX, topY + radius);
        context.arcTo(leftX, topY, leftX + radius, topY, radius);
    }
    context.closePath();
    context.fillStyle = color;
    context.globalAlpha = alpha;
    context.fill();

    if (isSelected) {
        context.strokeStyle = "#ff0000";
        context.setLineDash([4, 1]);
    } else {
        context.strokeStyle = lineColor;
    }

    context.lineWidth = lineWidth;

    context.stroke();
    var shadow = drawShadow(canvas);
    if (label) {
        if (isSelected) {
            context.font = "bold 12pt Arial Verdana Sans-serif";
        } else {
            context.font = "12pt Arial Verdana Sans-serif";
        }
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.globalAlpha = 1;
        context.fillStyle = "white";
        context.strokeStyle = "black";
        var w, h, max;

        w = width / 2;
        h = height / 2.5;
        max = width / 1.2;

        context.lineWidth = 2;
        context.miterLimit = 2;
        context.strokeText(label, w, h, max);
        context.fillText(label, w, h, max);
    }

    return {url: canvas.toDataURL(), shadowURL: shadow.toDataURL()};
};

CWRC.ColorMap = function (mapping, colorKey, defaultColor) {
    this.mapping = mapping || {};
    this.colorKey = colorKey;
    this.defaultColor = defaultColor;
};

CWRC.ColorMap.prototype.hasMapping = function () {
    return !!this.colorKey;
};

CWRC.ColorMap.prototype.getColor = function (selectedItem) {
    return (this.mapping[selectedItem[this.colorKey]]) || this.defaultColor;
};

CWRC.ColorMap.prototype.getLegendPairs = function () {
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

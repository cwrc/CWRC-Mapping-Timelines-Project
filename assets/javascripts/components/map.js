ko.components.register('map', {
    template: '<section>\
                    <a id="historicalMapToggle" href="#" data-bind="click: toggleHistoricalMap">\
                        Show Historical Map\
                    </a>\
                    <label id="historicalOpacityControls" data-bind="visible: showHistoricalMap">\
                        Opacity\
                        <input id="historicalMapOpacity" type="range" min="0.0" max="1.0" step="0.05"\
                                data-bind="value: historicalMapOpacity"/>\
                    </label>\
               </section>\
               <section>\
                    <span data-bind="text: unplottable"></span>\
                    out of\
                    <span data-bind="text: CWRC.rawData().length"></span>\
                    cannot be plotted\
               </section>\
               <!-- identifying by ID does limit to one map per page, but that works for now -->\
               <div id="map_canvas">\
               </div>',

    // Map takes:
    //    - zoom: Zoom level as an integer number. Default: 4
    //    - center: LatLng coordinates as a string. Default: '49.8994, -97.1392' (Winnipeg)
    //    - colorKey: The data label to group by colour
    //    - colors: The mapping between values and their color. Keys are case-sensitive.
    //                    eg. { orlandoProject: "#33ff00", multimedia: "blue"}
    // TODO: handle: pins, polygons, polylines
    // TODO: make it take the ID of a div that holds the marker templates. it should force-hide that div, or maybe abduct it as the legend?
    // TODO: redraw the curently selected pin and the old pin
    viewModel: function (params) {
        var self = this;

        // === MAP STATE ===
        self.colorKey = params.colorKey;
        self.colorMap = params.colors || {};
        self.colorMap._default = "#999";

        self.map = new google.maps.Map(document.getElementById('map_canvas'), {
            center: CWRC.Transform.parseLatLng(params.center || '49.8994, -97.1392'), // default to winnipeg
            zoom: params.zoom || 4
        });

        self.spiderfier = new OverlappingMarkerSpiderfier(self.map, {
            keepSpiderfied: true,     // stay open, even if a pin is selected
            spiralFootSeparation: 26, // Default: 26     # These three params will all magically change
            spiralLengthStart: 7,     // 11              # spiral size, and are freakishly
            spiralLengthFactor: 5.75  // 4               # interdependant. Good luck playing with them.
        });

        var swBound = new google.maps.LatLng(27.87, -181.56);
        var neBound = new google.maps.LatLng(81.69, -17.58);
        self.showHistoricalMap = ko.observable(false);
        self.historicalMapOpacity = ko.observable(0.6);
        self.historicalOverlay = new google.maps.GroundOverlay(
            'assets/images/maps/BNA_1854.png',
            new google.maps.LatLngBounds(swBound, neBound),
            {opacity: self.historicalMapOpacity()}
        );

        // === MAP BEHAVIOUR ===
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

        self['buildMarkersForItem'] = function (item) {
            if (!item.latLng)
                return [];

            var positions = typeof item.latLng == 'string' ? [item.latLng] : item.latLng;
            var created = [];

            for (var i = 0; i < positions.length; i++) {
                var label = ""; // TODO: set the label to denote the # of colocated markers
                var color = self.colorMap[item[self.colorKey]] || self.colorMap._default;

                var marker = new google.maps.Marker({
                    position: CWRC.Transform.parseLatLng(positions[i]),
                    map: self.map,
                    icon: window.createMarkerIcon(18, 18, color, label, {shape: "circle"})
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

        self._markersToDefaultIcons = {};
        self._selectedMarkers = [];
        self._itemIDToMarkers = {};
        CWRC.selected.subscribe(function () {
            var selectedItem = CWRC.selected();
            var newSelectedMarkers = self.itemToMarkers()[ko.toJSON(selectedItem)];

            // resetting the PREVIOUS markers
            for (var j = 0; j < self._selectedMarkers.length; j++) {
                var selectedMarker = self._selectedMarkers[j];

                selectedMarker.setIcon(self._markersToDefaultIcons[selectedMarker]);
                selectedMarker.setZIndex(null);
            }

            self._selectedMarkers = [];
            self._markersToDefaultIcons = {};

            // declared outside loop to allow panning to last one after the loop
            // panning to last (rather than pan/zoom to fit all) is easier for now
            var position;

            for (var i = 0; i < newSelectedMarkers.length; i++) {
                var marker = newSelectedMarkers[i];

                // get original position if spiderfied
                if (marker._omsData) {
                    // TODO: find a way to access this data without using the mini variable name
                    position = marker._omsData.l; // l because it's minified. This might break if they recompile differently.
                } else {
                    position = marker.position
                }

                var color = self.colorMap[selectedItem[self.colorKey]] || self.colorMap._default;

                self._markersToDefaultIcons[marker] = marker.getIcon();

                // now redraw the newly selected ones
                marker.setIcon(window.createMarkerIcon(18, 18, color, "", {shape: "circle"}, true));
                marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
                self._selectedMarkers.push(marker);
            }

            if (!self.map.getBounds().contains(position)) {
                self.map.panTo(position);
            }
        });
    }
});

// TODO: extract to a helper lib
window.createMarkerIcon = function (width, height, color, label, settings, isSelected) {
    // TODO: might be faster to store in a hash, if possible

    var drawShadow = function (icon) {
        var width = icon.width;
        var height = icon.height;
        var shadowWidth = width + height;
        var canvas = document.createElement("canvas");
        canvas.width = shadowWidth;
        canvas.height = height;
        var context = canvas.getContext("2d");
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
    var pinWidth = width / 2; // settings.pinWidth;
    var pinHeight = height / 2; // settings.pinHeight;
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
            context.font = "bold 10pt Arial";
        } else {
            context.font = "10pt Arial";
        }
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.globalAlpha = 1;
        context.fillStyle = "black";
        context.fillText(label, width / 2, height / 2, width / 1.4);
    }

    return {url: canvas.toDataURL(), shadowURL: shadow.toDataURL()};
};
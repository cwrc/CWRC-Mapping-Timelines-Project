ko.components.register('map', {
    template: '<div>\
                    <span data-bind="text: unplottable"></span>\
                    cannot be plotted\
               </div>\
               <div id="map_canvas">\
               </div>',

    // Map takes:
    //    - zoom: Zoom level as an integer number. Default: 4
    //    - center: LatLng coordinates as a string. Default: '49.8994, -97.1392' (Winnipeg)
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
                    map: self.map,
                    icon: window.createMarkerIcon(18, 18, "#555", "2", null, 50, {shape: "circle"}, false)
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
//            var hasColorKey = (this._accessors.getColorKey != null); // TODO :colours

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

                // TODO: colour
//                var color;
//
//                if (hasColorKey) {
//                    var colorKeys = new Exhibit.Set();
//                    var colorCodingFlags = {mixed: false, missing: false, others: false, keys: new Exhibit.Set()};
//
//                    this._accessors.getColorKey(selectedID, database, function (v) {
//                        colorKeys.add(v);
//                    });
//                    color = self._colorCoder.translateSet(colorKeys, colorCodingFlags);
//                    color = self._colorCoder.translateSet(colorKeys, colorCodingFlags);
//                }

                self._markersToDefaultIcons[marker] = marker.getIcon();

                // now redraw the newly selected ones
                marker.setIcon(window.createMarkerIcon(18, 18, "#aaa", "", null, 50, {shape: "circle"}, true));
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
window.createMarkerIcon = function (width, height, color, label, iconImg, iconSize, settings, isSelected) {
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
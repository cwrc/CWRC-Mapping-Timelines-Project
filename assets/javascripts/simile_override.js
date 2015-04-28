/**
 * CWRC Exhibit Override File
 *
 * We're doing this with an override file, to simple clone and then redefine the functions.
 * This monkeypatching is the cleanest way to separate the changes we're making from the original code.
 *
 * Each function override should have a note giving some insight into the reason for the change.
 */

// Overridden in order to move the export button
Exhibit.ToolboxWidget.prototype._onContainerMouseOver = function (evt) {
    if (!this._hovering) {
        var self = this;
        var coords = SimileAjax.DOM.getPageCoordinates(this._containerElmt);
        var docWidth = document.body.offsetWidth;
        var docHeight = document.body.offsetHeight;
        var popup = document.createElement("div");

        var offsetX = 250; // widget offsets
        var offsetY = 5;

        popup.className = "exhibit-toolboxWidget-popup screen";
//        popup.style.right = (coords.left + offsetX) + "px";
        popup.style.top = (coords.top + offsetY) + "px";
        popup.style.right = (docWidth - coords.left - this._containerElmt.offsetWidth + offsetX) + "px";

        this._fillPopup(popup);

        document.body.appendChild(popup);
        popup.onmouseover = function (evt) {
            self._onPopupMouseOver(evt);
        };
        popup.onmouseout = function (evt) {
            self._onPopupMouseOut(evt);
        };
        this._popup = popup;
        this._hovering = true;
    } else {
        this._clearTimeout();
    }
};

// Overridden to move the export popup menu
Exhibit.UI.createPopupMenuDom = function (element) {
    var div = document.createElement("div");
    div.className = "exhibit-menu-popup exhibit-ui-protection";

    var dom = {elmt: div, close: function () {
        document.body.removeChild(this.elmt);
    }, open: function () {
        var self = this;

        this.layer = SimileAjax.WindowManager.pushLayer(function () {
            self.close();
        }, true, div);

        var docWidth = document.body.offsetWidth;
        var docHeight = document.body.offsetHeight;
        var coords = SimileAjax.DOM.getPageCoordinates(element);

        div.style.left = coords.left;
        div.style.top = (coords.top + element.scrollHeight) + "px";
//        div.style.right = (docWidth - (coords.left + element.scrollWidth)) + "px";

        document.body.appendChild(this.elmt);
    }, appendMenuItem: function (label, icon, onClick) {
        var self = this;
        var a = document.createElement("a");

        a.className = "exhibit-menu-item";
        a.href = "javascript:";

        SimileAjax.WindowManager.registerEvent(a, "click", function (elmt, evt, target) {
            onClick(elmt, evt, target);
            SimileAjax.WindowManager.popLayer(self.layer);
            SimileAjax.DOM.cancelEvent(evt);
            return false;
        });

        var div = document.createElement("div");

        a.appendChild(div);
        div.appendChild(SimileAjax.Graphics.createTranslucentImage(icon != null ? icon : (Exhibit.urlPrefix + "images/blank-16x16.png")));
        div.appendChild(document.createTextNode(label));
        this.elmt.appendChild(a);
    }, appendSeparator: function () {
        var hr = document.createElement("hr");
        this.elmt.appendChild(hr);
    }};
    return dom;
};

// Overridden to get the label layer on top of the events.
Timeline.GregorianEtherPainter.prototype.paint = function () {
    if (this._markerLayer) {
        this._band.removeLayerDiv(this._markerLayer);
    }
    this._markerLayer = this._band.createLayerDiv(150);
    this._markerLayer.setAttribute("name", "ether-markers");
    this._markerLayer.style.display = "none";
    if (this._lineLayer) {
        this._band.removeLayerDiv(this._lineLayer);
    }
    this._lineLayer = this._band.createLayerDiv(1);
    this._lineLayer.setAttribute("name", "ether-lines");
    this._lineLayer.style.display = "none";
    var minDate = this._band.getMinDate();
    var maxDate = this._band.getMaxDate();
    var timeZone = this._band.getTimeZone();
    var labeller = this._band.getLabeller();
    SimileAjax.DateTime.roundDownToInterval(minDate, this._unit, timeZone, this._multiple, this._theme.firstDayOfWeek);
    var p = this;
    var incrementDate = function (date) {
        for (var i = 0;
             i < p._multiple;
             i++) {
            SimileAjax.DateTime.incrementByInterval(date, p._unit);
        }
    };
    while (minDate.getTime() < maxDate.getTime()) {
        this._intervalMarkerLayout.createIntervalMarker(minDate, labeller, this._unit, this._markerLayer, this._lineLayer);
        incrementDate(minDate);
    }
    this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";

    // added to no longer block the events layer clicks
    this._markerLayer.parentNode.style.height = "1.5em";
    this._markerLayer.parentNode.style.bottom = "0em";
};

// Overridden to allow scrolling past the end of the view by one half viewport.
Timeline._Band.prototype._bounceBack = function (f) {
    if (!this._supportsOrthogonalScrolling) {
        return;
    }

    var target = 0;
    if (this._viewOrthogonalOffset < 0) {
        var orthogonalExtent = this._eventPainter.getOrthogonalExtent();
        if (this._viewOrthogonalOffset + orthogonalExtent >= this.getViewWidth()) {
            target = this._viewOrthogonalOffset; // I think this is the case where no movement needed - remiller
        } else {
            target = Math.min(0, this.getViewWidth() / 2 - orthogonalExtent);
        }
    }
    if (target != this._viewOrthogonalOffset) {
        var self = this;
        SimileAjax.Graphics.createAnimation(function (abs, diff) {
            self._viewOrthogonalOffset = abs;
            self._eventPainter.softPaint();
            self._showScrollbar();
            self._fireOnOrthogonalScroll();
        }, this._viewOrthogonalOffset, target, 300, function () {
            self._hideScrollbar();
        }).run();
    } else {
        this._hideScrollbar();
    }
};

// Overridden to make it search the whole stack instead of just checking the first.
Exhibit.TimelineView.prototype._select = function (selection) {
    for (var itemNum = 0; itemNum < selection.itemIDs.length; itemNum++) {
        var itemID = selection.itemIDs[itemNum];

        var bandCount = this._timeline.getBandCount();

        for (var i = 0; i < bandCount; i++) {
            var band = this._timeline.getBand(i);
            var evt = band.getEventSource().getEvent(itemID);

            if (evt) {
                band.showBubbleForEvent(itemID);
                return;
            }
        }
    }
};

// Overridden to get the center widget showing the timeline stuff
Timeline.OriginalEventPainter.prototype._showBubble = function (x, y, evt) {
    var details = document.getElementById('detailsBox');
    details.innerHTML = '';

    var selectedClass = 'timeline-selected';
    var selected = document.getElementsByClassName(selectedClass);

    for (var i = 0; i < selected.length; i++) {
        selected[i].classList.remove(selectedClass);
    }

    var elementId = 'label-tl-0-0-' + evt._eventID.trim();
    document.getElementById(elementId).classList.add(selectedClass);

    evt.fillInfoBubble(details, this._params.theme, this._band.getLabeller());

    details.firstChild.removeAttribute('style'); // nuke their useless styling, replace with relevant stuff
    details.firstChild.style.overflow = 'auto';
};

// overridden to make map notes work with untrimmed data (eg. biblifo)
Exhibit.TimelineView.prototype._select = function (selection) {
    var itemID = selection.itemIDs[0].trim();
    var c = this._timeline.getBandCount();
    for (var i = 0;
         i < c;
         i++) {
        var band = this._timeline.getBand(i);
        var evt = band.getEventSource().getEvent(itemID);
        if (evt) {
            band.showBubbleForEvent(itemID);
            break;
        }
    }
};

Exhibit.MapView.prototype._markersToDefaultIcons = {};
Exhibit.MapView.prototype._selectedMarkers = [];
Exhibit.MapView.prototype._itemIDToMarkers = {};


Exhibit.MapView.prototype._select = function (selection, ignorePan) {
    var self = this;
    var selectedID = selection.itemIDs[0];
    var newSelectedMarkers = self._itemIDToMarkers[selectedID];
    var hasColorKey = (this._accessors.getColorKey != null);
    var database = this._uiContext.getDatabase();

    // resetting the PREVIOUS markers
    for (var j = 0; j < self._selectedMarkers.length; j++) {
        var selectedMarker = self._selectedMarkers[j];

        selectedMarker.setIcon(self._markersToDefaultIcons[selectedMarker]);
        selectedMarker.setZIndex(null);
    }

    self._selectedMarkers = [];
    self._markersToDefaultIcons = {};

    // can't select what isn't there. Some events have no map stuff.
    if (!newSelectedMarkers)
        return;

    // out of loop to pan to final one afterward
    // panning to last (rather than pan/zoom to fit all) is easier for now
    var position;

    for (var i = 0; i < newSelectedMarkers.length; i++) {
        var marker = newSelectedMarkers[i];

        if (marker._omsData) {
            // TODO: find a way to access this data without using the mini variable name
            position = marker._omsData.l; // l because it's minified. This might break if they recompile differently.
        } else {
            position = marker.position
        }
        var color;

        if (hasColorKey) {
            var colorKeys = new Exhibit.Set();
            var colorCodingFlags = {mixed: false, missing: false, others: false, keys: new Exhibit.Set()};

            this._accessors.getColorKey(selectedID, database, function (v) {
                colorKeys.add(v);
            });
            color = self._colorCoder.translateSet(colorKeys, colorCodingFlags);
            color = self._colorCoder.translateSet(colorKeys, colorCodingFlags);
        }

        self._markersToDefaultIcons[marker] = marker.getIcon();

        // now redraw the newly selected ones
        marker.setIcon({url: Exhibit.MapView.makeCanvasIcon(18, 18, color, '', null, 18, self._settings, true).iconURL});
        marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
        self._selectedMarkers.push(marker);
    }

    if (!ignorePan) {
        self._map.panTo(position);
    }
};

// overridden to use spiderfy for stacks
Exhibit.MapView.prototype._rePlotItems = function (unplottableItems) {
    var self = this;
    var collection = this._uiContext.getCollection();
    var database = this._uiContext.getDatabase();
    var settings = this._settings;
    var accessors = this._accessors;
    var currentSet = collection.getRestrictedItems();

    var exhibit = this._uiContext.getExhibit();


    var locationToData = {};
    var hasColorKey = (accessors.getColorKey != null);
    var hasSizeKey = (accessors.getSizeKey != null);
    var hasIconKey = (accessors.getIconKey != null);
    var hasIcon = (accessors.getIcon != null);
    var hasPoints = (this._getLatlng != null);
    var hasPolygons = (accessors.getPolygon != null);
    var hasPolylines = (accessors.getPolyline != null);

    var makeLatLng = settings.latlngOrder == "latlng" ? function (first, second) {
        return new google.maps.LatLng(first, second);
    } : function (first, second) {
        return new google.maps.LatLng(second, first);
    };

    var colorCodingFlags = {mixed: false, missing: false, others: false, keys: new Exhibit.Set()};
    var sizeCodingFlags = {mixed: false, missing: false, others: false, keys: new Exhibit.Set()};
    var iconCodingFlags = {mixed: false, missing: false, others: false, keys: new Exhibit.Set()};
    var bounds, maxAutoZoom = Infinity;

    currentSet.visit(function (itemID) {
        var latlngs = [];
        var polygons = [];
        var polylines = [];
        if (hasPoints) {
            self._getLatlng(itemID, database, function (v) {
                if (v != null && "lat" in v && "lng" in v) {
                    latlngs.push(v);
                }
            });
        }
        if (hasPolygons) {
            accessors.getPolygon(itemID, database, function (v) {
                if (v != null) {
                    polygons.push(v);
                }
            });
        }
        if (hasPolylines) {
            accessors.getPolyline(itemID, database, function (v) {
                if (v != null) {
                    polylines.push(v);
                }
            });
        }
        if (latlngs.length > 0 || polygons.length > 0 || polylines.length > 0) {
            var color = self._settings.color;
            var colorKeys = null;
            if (hasColorKey) {
                colorKeys = new Exhibit.Set();
                accessors.getColorKey(itemID, database, function (v) {
                    colorKeys.add(v);
                });
                color = self._colorCoder.translateSet(colorKeys, colorCodingFlags);
            }
            if (latlngs.length > 0) {
                var sizeKeys = null;
                if (hasSizeKey) {
                    sizeKeys = new Exhibit.Set();
                    accessors.getSizeKey(itemID, database, function (v) {
                        sizeKeys.add(v);
                    });
                }
                var iconKeys = null;
                if (hasIconKey) {
                    iconKeys = new Exhibit.Set();
                    accessors.getIconKey(itemID, database, function (v) {
                        iconKeys.add(v);
                    });
                }
                for (var n = 0;
                     n < latlngs.length;
                     n++) {
                    var latlng = latlngs[n];
                    var latlngKey = latlng.lat + "," + latlng.lng;
                    if (latlngKey in locationToData) {
                        var locationData = locationToData[latlngKey];
                        locationData.items.push(itemID);
                        if (hasColorKey) {
                            locationData.colorKeys.addSet(colorKeys);
                        }
                        if (hasSizeKey) {
                            locationData.sizeKeys.addSet(sizeKeys);
                        }
                        if (hasIconKey) {
                            locationData.iconKeys.addSet(iconKeys);
                        }
                    } else {
                        var locationData = {latlng: latlng, items: [itemID]};
                        if (hasColorKey) {
                            locationData.colorKeys = colorKeys;
                        }
                        if (hasSizeKey) {
                            locationData.sizeKeys = sizeKeys;
                        }
                        if (hasIconKey) {
                            locationData.iconKeys = iconKeys;
                        }
                        locationToData[latlngKey] = locationData;
                    }
                }
            }
            for (var p = 0;
                 p < polygons.length;
                 p++) {
                self._plotPolygon(itemID, polygons[p], color, makeLatLng);
            }
            for (var p = 0;
                 p < polylines.length;
                 p++) {
                self._plotPolyline(itemID, polylines[p], color, makeLatLng);
            }
        } else {
            unplottableItems.push(itemID);
        }
    });


    var spiderOpts = {
        keepSpiderfied: true,
        spiralFootSeparation: 26, // Default: 26     # magically changes spiral size
        spiralLengthStart: 7, // 11                  # magically changes spiral size
        spiralLengthFactor: 5.75 // 4                # magically changes spiral size
    };
    var spiderfy = new OverlappingMarkerSpiderfier(self._map, spiderOpts);
    var addMarkersAtLocation = function (locationData) {

        for (var i = 0; i < locationData.items.length; i++) {
            var item = locationData.items[i];

            var itemCount = locationData.items.length;
            if (!bounds) {
                bounds = new google.maps.LatLngBounds();
            }
            var shape = self._settings.shape;
            var color = self._settings.color;
            if (hasColorKey) {
                color = self._colorCoder.translateSet(locationData.colorKeys, colorCodingFlags);
            }
            var iconSize = self._settings.iconSize;
            if (hasSizeKey) {
                iconSize = self._sizeCoder.translateSet(locationData.sizeKeys, sizeCodingFlags);
            }
            var icon = null;
            if (itemCount == 1) {
                if (hasIcon) {
                    accessors.getIcon(locationData.items[0], database, function (v) {
                        icon = v;
                    });
                }
            }
            if (hasIconKey) {
                icon = self._iconCoder.translateSet(locationData.iconKeys, iconCodingFlags);
            }
            var point = new google.maps.LatLng(locationData.latlng.lat, locationData.latlng.lng);
            if (maxAutoZoom > locationData.latlng.maxAutoZoom) {
                maxAutoZoom = locationData.latlng.maxAutoZoom;
            }
            bounds.extend(point);

            var marker = Exhibit.MapView._makeMarker(point, shape, color, iconSize, icon, itemCount == 1 ? "" : itemCount.toString(), self._settings);
            spiderfy.addMarker(marker);
            marker.cwrcData = [item];

//          google.maps.event.addListener(marker, "click", function () {
//              self._showInfoWindow(locationData.items, null, marker);
//              if (self._selectListener != null) {
//                  self._selectListener.fire({itemIDs: locationData.items});
//              }
//          });

            marker.setMap(self._map);
            self._overlays.push(marker);


            if (self._itemIDToMarkers[item]) {
                self._itemIDToMarkers[item].push(marker);
            } else {
                self._itemIDToMarkers[item] = [marker];
            }


//            for (var x = 0; x < locationData.items.length; x++) {
//                self._itemIDToMarker[locationData.items[x]] = marker;
//            }
        }
    };
    try {
        for (var latlngKey in locationToData) {
            addMarkersAtLocation(locationToData[latlngKey]);
        }

        spiderfy.addListener('click', function (marker, event) {
//            self._showInfoWindow(marker.cwrcData, null, marker);
            if (self._selectListener != null) {
                var selectData = {itemIDs: marker.cwrcData};

                self._selectListener.fire(selectData);
                self._select(selectData, true);
            }
        });
    } catch (e) {
        alert(e);
    }
    if (hasColorKey) {
        var legendWidget = this._dom.legendWidget;
        var colorCoder = this._colorCoder;
        var keys = colorCodingFlags.keys.toArray().sort();
        if (settings.colorLegendLabel !== null) {
            legendWidget.addLegendLabel(settings.colorLegendLabel, "color");
        }
        if (colorCoder._gradientPoints != null) {
            var legendGradientWidget = this._dom.legendGradientWidget;
            legendGradientWidget.addGradient(this._colorCoder._gradientPoints);
        } else {
            for (var k = 0;
                 k < keys.length;
                 k++) {
                var key = keys[k];
                var color = colorCoder.translate(key);
                legendWidget.addEntry(color, key);
            }
        }
        if (colorCodingFlags.others) {
            legendWidget.addEntry(colorCoder.getOthersColor(), colorCoder.getOthersLabel());
        }
        if (colorCodingFlags.mixed && legendWidget) {
            legendWidget.addEntry(colorCoder.getMixedColor(), colorCoder.getMixedLabel());
        }
        if (colorCodingFlags.missing) {
            legendWidget.addEntry(colorCoder.getMissingColor(), colorCoder.getMissingLabel());
        }
    }
    if (hasSizeKey) {
        var legendWidget = this._dom.legendWidget;
        var sizeCoder = this._sizeCoder;
        var keys = sizeCodingFlags.keys.toArray().sort();
        if (settings.sizeLegendLabel !== null) {
            legendWidget.addLegendLabel(settings.sizeLegendLabel, "size");
        }
        if (sizeCoder._gradientPoints != null) {
            var points = sizeCoder._gradientPoints;
            var space = (points[points.length - 1].value - points[0].value) / 5;
            keys = [];
            for (var i = 0;
                 i < 6;
                 i++) {
                keys.push(Math.floor(points[0].value + space * i));
            }
            for (var k = 0;
                 k < keys.length;
                 k++) {
                var key = keys[k];
                var size = sizeCoder.translate(key);
                legendWidget.addEntry(size, key, "size");
            }
        } else {
            for (var k = 0;
                 k < keys.length;
                 k++) {
                var key = keys[k];
                var size = sizeCoder.translate(key);
                legendWidget.addEntry(size, key, "size");
            }
            if (sizeCodingFlags.others) {
                legendWidget.addEntry(sizeCoder.getOthersSize(), sizeCoder.getOthersLabel(), "size");
            }
            if (sizeCodingFlags.mixed) {
                legendWidget.addEntry(sizeCoder.getMixedSize(), sizeCoder.getMixedLabel(), "size");
            }
            if (sizeCodingFlags.missing) {
                legendWidget.addEntry(sizeCoder.getMissingSize(), sizeCoder.getMissingLabel(), "size");
            }
        }
    }
    if (hasIconKey) {
        var legendWidget = this._dom.legendWidget;
        var iconCoder = this._iconCoder;
        var keys = iconCodingFlags.keys.toArray().sort();
        if (settings.iconLegendLabel != null) {
            legendWidget.addLegendLabel(settings.iconLegendLabel, "icon");
        }
        for (var k = 0;
             k < keys.length;
             k++) {
            var key = keys[k];
            var icon = iconCoder.translate(key);
            legendWidget.addEntry(icon, key, "icon");
        }
        if (iconCodingFlags.others) {
            legendWidget.addEntry(iconCoder.getOthersIcon(), iconCoder.getOthersLabel(), "icon");
        }
        if (iconCodingFlags.mixed) {
            legendWidget.addEntry(iconCoder.getMixedIcon(), iconCoder.getMixedLabel(), "icon");
        }
        if (iconCodingFlags.missing) {
            legendWidget.addEntry(iconCoder.getMissingIcon(), iconCoder.getMissingLabel(), "icon");
        }
    }
    if (bounds && settings.autoposition && !this._shown) {
        self._map.fitBounds(bounds);
        if (self._map.getZoom > maxAutoZoom) {
            self._map_setZoom(maxAutoZoom);
        }
    }
    this._shown = true;
};

// overridden to customize the text size and pin style
Exhibit.MapView.makeCanvasIcon = function (width, height, color, label, iconImg, iconSize, settings, isSelected) {
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
    var pin = settings.pin;
    var pinWidth = settings.pinWidth;
    var pinHeight = settings.pinHeight;
    var lineWidth = isSelected ? 4 : 1;
    var lineColor = settings.borderColor || "black";
    var alpha = settings.shapeAlpha;
    var bodyWidth = width - lineWidth;
    var bodyHeight = height - lineWidth;
    var markerHeight = height + (pin ? pinHeight : 0);
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
    if (iconImg) {
        context.save();
        context.clip();
        context.globalAlpha = 1;
        context.translate(width / 2 + settings.iconOffsetX, height / 2 + settings.iconOffsetY);
        var scale;
        var heightScale = 1 * height / iconImg.naturalHeight;
        var widthScale = 1 * width / iconImg.naturalWidth;
        switch (settings.iconFit) {
            case"width":
                scale = widthScale;
                break;
            case"height":
                scale = heightScale;
                break;
            case"both":
            case"larger":
                scale = Math.min(heightScale, widthScale);
                break;
            case"smaller":
                scale = Math.max(heightScale, widthScale);
                break;
        }
        context.scale(scale, scale);
        context.scale(settings.iconScale, settings.iconScale);
        context.drawImage(iconImg, -iconImg.naturalWidth / 2, -iconImg.naturalHeight / 2);
        context.restore();
    }

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
    return{iconURL: canvas.toDataURL(), shadowURL: shadow.toDataURL()};
};

Exhibit.MapView._makeMarker = function (position, shape, color, iconSize, iconURL, label, settings, isSelected) {
    var key = "#" + shape + "#" + color + "#" + iconSize + "#" + iconURL + "#" + label;
    var cached = Exhibit.MapView.markerCache[key];
    if (cached && (cached.settings == settings)) {
        return new google.maps.Marker({
            icon: cached.markerImage,
            shadow: cached.shadowImage,
            shape: cached.markerShape,
            position: position,
            optimized: false
        });
    }
    var extra = label.length;
    var halfWidth = Math.ceil(settings.shapeWidth / 2) + extra;
    var bodyHeight = settings.shapeHeight + 2 * extra;
    var width = halfWidth * 2;
    var height = bodyHeight;
    var pin = settings.pin;
    if (iconSize > 0) {
        width = iconSize;
        halfWidth = Math.ceil(iconSize / 2);
        height = iconSize;
        bodyHeight = iconSize;
    }
    var markerImage = {};
    var markerShape = {type: "poly"};
    var shadowImage = {};
    if (pin) {
        var pinHeight = settings.pinHeight;
        var pinHalfWidth = Math.ceil(settings.pinWidth / 2);
        height += pinHeight;
        markerImage.anchor = new google.maps.Point(halfWidth, height);
        shadowImage.anchor = new google.maps.Point(halfWidth, height);
        markerShape.coords = [0, 0, 0, bodyHeight, halfWidth - pinHalfWidth, bodyHeight, halfWidth, height, halfWidth + pinHalfWidth, bodyHeight, width, bodyHeight, width, 0];
    } else {
        markerImage.anchor = new google.maps.Point(halfWidth, Math.ceil(height / 2));
        shadowImage.anchor = new google.maps.Point(halfWidth, Math.ceil(height / 2));
        markerShape.coords = [0, 0, 0, bodyHeight, width, bodyHeight, width, 0];
    }
    markerImage.size = new google.maps.Size(width, height);
    shadowImage.size = new google.maps.Size(width + height / 2, height);
    var markerPair;
    if ((!Exhibit.MapView._hasCanvas) || (iconURL == null)) {
        if (!Exhibit.MapView._hasCanvas) {
            markerPair = Exhibit.MapView.makePainterIcon(width, bodyHeight, color, label, iconURL, iconSize, settings);
        } else {
            markerPair = Exhibit.MapView.makeCanvasIcon(width, bodyHeight, color, label, null, iconSize, settings, isSelected);
        }
        markerImage.url = markerPair.iconURL;
        shadowImage.url = markerPair.shadowURL;
        cached = Exhibit.MapView.markerCache[key] = {markerImage: markerImage, shadowImage: shadowImage, markerShape: markerShape};
        return new google.maps.Marker(
            {
                icon: cached.markerImage,
                shadow: cached.shadowImage,
                shape: cached.markerShape,
                position: position,
                optimized: false
            });
    } else {
        var marker = Exhibit.MapView._makeMarker(position, shape, color, iconSize, null, label, settings);
        cached = {markerImage: marker.getIcon(), shadowImage: marker.getShadow(), markerShape: marker.getShape(), settings: settings};
        var image = new Image();
        image.onload = function () {
            try {
                cached.markerImage.url = Exhibit.MapView.makeCanvasIcon(width, bodyHeight, color, label, image, iconSize, settings).iconURL;
            } catch (e) {
                cached.markerImage.url = Exhibit.MapView.makePainterIcon(width, bodyHeight, color, label, iconURL, iconSize, settings).iconURL;
            }
            Exhibit.MapView.markerCache[key] = cached;
            marker.setIcon(cached.markerImage);
        };
        image.src = iconURL;
        return marker;
    }
};

// TODO: Possible to override this one to make it do the custom centering that michael requested
// Todo: we also should look into making a new HTML attribute for this.
//Exhibit.TimelineView.prototype._reconstruct = function () {
//    var self = this;
//    var collection = this._uiContext.getCollection();
//    var database = this._uiContext.getDatabase();
//    var settings = this._settings;
//    var accessors = this._accessors;
//    var currentSize = collection.countRestrictedItems();
//    var unplottableItems = [];
//    this._dom.legendWidget.clear();
//    this._eventSource.clear();
//    if (currentSize > 0) {
//        var currentSet = collection.getRestrictedItems();
//        var hasColorKey = (this._accessors.getColorKey != null);
//        var hasIconKey = (this._accessors.getIconKey != null && this._iconCoder != null);
//        var hasHoverText = (this._accessors.getHoverText != null);
//        var colorCodingFlags = {mixed: false, missing: false, others: false, keys: new Exhibit.Set()};
//        var iconCodingFlags = {mixed: false, missing: false, others: false, keys: new Exhibit.Set()};
//        var events = [];
//        var addEvent = function (itemID, duration, color, icon, hoverText) {
//            var label;
//            accessors.getEventLabel(itemID, database, function (v) {
//                label = v;
//                return true;
//            });
//            var evt = new Timeline.DefaultEventSource.Event({id: itemID, eventID: itemID, start: duration.start, end: duration.end, instant: duration.end == null, text: label, description: "", icon: icon, color: color, textColor: color, hoverText: hoverText});
//            evt._itemID = itemID;
//            evt.getProperty = function (name) {
//                return database.getObject(this._itemID, name);
//            };
//            evt.fillInfoBubble = function (elmt, theme, labeller) {
//                self._fillInfoBubble(this, elmt, theme, labeller);
//            };
//            events.push(evt);
//        };
//        currentSet.visit(function (itemID) {
//            var durations = [];
//            self._getDuration(itemID, database, function (duration) {
//                if ("start" in duration) {
//                    durations.push(duration);
//                }
//            });
//            if (durations.length > 0) {
//                var color = null;
//                var icon = null;
//                var hoverText = null;
//                if (hasColorKey) {
//                    var colorKeys = new Exhibit.Set();
//                    accessors.getColorKey(itemID, database, function (key) {
//                        colorKeys.add(key);
//                    });
//                    color = self._colorCoder.translateSet(colorKeys, colorCodingFlags);
//                }
//                var icon = null;
//                if (hasIconKey) {
//                    var iconKeys = new Exhibit.Set();
//                    accessors.getIconKey(itemID, database, function (key) {
//                        iconKeys.add(key);
//                    });
//                    icon = self._iconCoder.translateSet(iconKeys, iconCodingFlags);
//                }
//                if (hasHoverText) {
//                    var hoverKeys = new Exhibit.Set();
//                    accessors.getHoverText(itemID, database, function (key) {
//                        hoverKeys.add(key);
//                    });
//                    for (var i in hoverKeys._hash) {
//                        hoverText = i;
//                    }
//                }
//                for (var i = 0;
//                     i < durations.length;
//                     i++) {
//                    addEvent(itemID, durations[i], color, icon, hoverText);
//                }
//            } else {
//                unplottableItems.push(itemID);
//            }
//        });
//        if (hasColorKey) {
//            var legendWidget = this._dom.legendWidget;
//            var colorCoder = this._colorCoder;
//            var keys = colorCodingFlags.keys.toArray().sort();
//            if (this._colorCoder._gradientPoints != null) {
//                legendWidget.addGradient(this._colorCoder._gradientPoints);
//            } else {
//                for (var k = 0;
//                     k < keys.length;
//                     k++) {
//                    var key = keys[k];
//                    var color = colorCoder.translate(key);
//                    legendWidget.addEntry(color, key);
//                }
//            }
//            if (colorCodingFlags.others) {
//                legendWidget.addEntry(colorCoder.getOthersColor(), colorCoder.getOthersLabel());
//            }
//            if (colorCodingFlags.mixed) {
//                legendWidget.addEntry(colorCoder.getMixedColor(), colorCoder.getMixedLabel());
//            }
//            if (colorCodingFlags.missing) {
//                legendWidget.addEntry(colorCoder.getMissingColor(), colorCoder.getMissingLabel());
//            }
//        }
//        if (hasIconKey) {
//            var legendWidget = this._dom.legendWidget;
//            var iconCoder = this._iconCoder;
//            var keys = iconCodingFlags.keys.toArray().sort();
//            if (settings.iconLegendLabel != null) {
//                legendWidget.addLegendLabel(settings.iconLegendLabel, "icon");
//            }
//            for (var k = 0;
//                 k < keys.length;
//                 k++) {
//                var key = keys[k];
//                var icon = iconCoder.translate(key);
//                legendWidget.addEntry(icon, key, "icon");
//            }
//            if (iconCodingFlags.others) {
//                legendWidget.addEntry(iconCoder.getOthersIcon(), iconCoder.getOthersLabel(), "icon");
//            }
//            if (iconCodingFlags.mixed) {
//                legendWidget.addEntry(iconCoder.getMixedIcon(), iconCoder.getMixedLabel(), "icon");
//            }
//            if (iconCodingFlags.missing) {
//                legendWidget.addEntry(iconCoder.getMissingIcon(), iconCoder.getMissingLabel(), "icon");
//            }
//        }
//        var plottableSize = currentSize - unplottableItems.length;
//        if (plottableSize > this._largestSize) {
//            this._largestSize = plottableSize;
//            this._reconstructTimeline(events);
//        } else {
//            this._eventSource.addMany(events);
//        }
//        var band = this._timeline.getBand(0);
//        var centerDate = band.getCenterVisibleDate();
//        var earliest = this._eventSource.getEarliestDate();
//        var latest = this._eventSource.getLatestDate();
//
//        if (CWRC.settings.) {
//
//        } else {
//            if (earliest != null && centerDate > earliest) {
//                band.scrollToCenter(earliest);
//            } else {
//                if (latest != null && centerDate > latest) {
//                    band.scrollToCenter(latest);
//                }
//            }
//        }
//    }
//    this._dom.setUnplottableMessage(currentSize, unplottableItems);
//};


//Timeline._Band.prototype.showBubbleForEvent = function (eventID) {
//
//    var evt = this.getEventSource().getEvent(eventID);
//    if (evt) {
//        var self = this;
//        this.scrollToCenter(evt.getStart(), function () {
//            self._eventPainter.showBubble(evt);
//        });
//    }
//};
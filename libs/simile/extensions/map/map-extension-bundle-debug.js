﻿/* map-view.js */
Exhibit.MapView = function (containerElmt, uiContext) {
    Exhibit.MapView._initialize();
    this._div = containerElmt;
    this._uiContext = uiContext;
    this._overlays = [];
    this._settings = {};
    this._accessors = {getProxy: function (itemID, database, visitor) {
        visitor(itemID);
    }, getColorKey: null, getSizeKey: null, getIconKey: null, getIcon: null};
    this._colorCoder = null;
    this._sizeCoder = null;
    this._iconCoder = null;
    this._selectListener = null;
    this._itemIDToMarker = {};
    var view = this;
    this._listener = {onItemsChanged: function () {
        view._reconstruct();
    }};
    uiContext.getCollection().addListener(this._listener);
};
Exhibit.MapView._settingSpecs = {"latlngOrder": {type: "enum", defaultValue: "latlng", choices: ["latlng", "lnglat"]}, "latlngPairSeparator": {type: "text", defaultValue: ";"}, "center": {type: "float", defaultValue: [20, 0], dimensions: 2}, "zoom": {type: "float", defaultValue: 2}, "autoposition": {type: "boolean", defaultValue: false}, "scrollWheelZoom": {type: "boolean", defaultValue: true}, "size": {type: "text", defaultValue: "small"}, "scaleControl": {type: "boolean", defaultValue: true}, "overviewControl": {type: "boolean", defaultValue: false}, "type": {type: "enum", defaultValue: "normal", choices: ["normal", "satellite", "hybrid", "terrain"]}, "bubbleTip": {type: "enum", defaultValue: "top", choices: ["top", "bottom"]}, "mapHeight": {type: "int", defaultValue: 400}, "mapConstructor": {type: "function", defaultValue: null}, "color": {type: "text", defaultValue: "#FF9000"}, "colorCoder": {type: "text", defaultValue: null}, "sizeCoder": {type: "text", defaultValue: null}, "iconCoder": {type: "text", defaultValue: null}, "selectCoordinator": {type: "text", defaultValue: null}, "iconSize": {type: "int", defaultValue: 0}, "iconFit": {type: "text", defaultValue: "smaller"}, "iconScale": {type: "float", defaultValue: 1}, "iconOffsetX": {type: "float", defaultValue: 0}, "iconOffsetY": {type: "float", defaultValue: 0}, "shape": {type: "text", defaultValue: "circle"}, "shapeWidth": {type: "int", defaultValue: 24}, "shapeHeight": {type: "int", defaultValue: 24}, "shapeAlpha": {type: "float", defaultValue: 0.7}, "pin": {type: "boolean", defaultValue: true}, "pinHeight": {type: "int", defaultValue: 6}, "pinWidth": {type: "int", defaultValue: 6}, "borderOpacity": {type: "float", defaultValue: 0.5}, "borderWidth": {type: "int", defaultValue: 1}, "borderColor": {type: "text", defaultValue: null}, "opacity": {type: "float", defaultValue: 0.7}, "sizeLegendLabel": {type: "text", defaultValue: null}, "colorLegendLabel": {type: "text", defaultValue: null}, "iconLegendLabel": {type: "text", defaultValue: null}, "markerScale": {type: "text", defaultValue: null}, "showHeader": {type: "boolean", defaultValue: true}, "showSummary": {type: "boolean", defaultValue: true}, "showFooter": {type: "boolean", defaultValue: true}, "showToolbox": {type: "boolean", defaultValue: true}};
Exhibit.MapView._accessorSpecs = [
    {accessorName: "getProxy", attributeName: "proxy"},
    {accessorName: "getLatlng", alternatives: [
        {bindings: [
            {attributeName: "latlng", types: ["float", "float"], bindingNames: ["lat", "lng"]},
            {attributeName: "maxAutoZoom", type: "float", bindingName: "maxAutoZoom", optional: true}
        ]},
        {bindings: [
            {attributeName: "lat", type: "float", bindingName: "lat"},
            {attributeName: "lng", type: "float", bindingName: "lng"},
            {attributeName: "maxAutoZoom", type: "float", bindingName: "maxAutoZoom", optional: true}
        ]}
    ]},
    {accessorName: "getPolygon", attributeName: "polygon", type: "text"},
    {accessorName: "getPolyline", attributeName: "polyline", type: "text"},
    {accessorName: "getColorKey", attributeName: "marker", type: "text"},
    {accessorName: "getColorKey", attributeName: "colorKey", type: "text"},
    {accessorName: "getSizeKey", attributeName: "sizeKey", type: "text"},
    {accessorName: "getIconKey", attributeName: "iconKey", type: "text"},
    {accessorName: "getIcon", attributeName: "icon", type: "url"}
];
Exhibit.MapView._initialize = function () {
    var links = [];
    var heads = document.documentElement.getElementsByTagName("head");
    for (var h = 0;
         h < heads.length;
         h++) {
        var linkElmts = heads[h].getElementsByTagName("link");
        for (var l = 0;
             l < linkElmts.length;
             l++) {
            var link = linkElmts[l];
            if (link.rel.match(/\bexhibit\/map-painter\b/)) {
                Exhibit.MapView._markerUrlPrefix = link.href + "?";
            }
        }
    }
    var canvas = document.createElement("canvas");
    Exhibit.MapView._hasCanvas = (canvas.getContext && canvas.getContext("2d"));
    Exhibit.MapView._initialize = function () {
    };
};
Exhibit.MapView.create = function (configuration, containerElmt, uiContext) {
    var view = new Exhibit.MapView(containerElmt, Exhibit.UIContext.create(configuration, uiContext));
    Exhibit.MapView._configure(view, configuration);
    view._internalValidate();
    view._initializeUI();
    return view;
};
Exhibit.MapView.createFromDOM = function (configElmt, containerElmt, uiContext) {
    var configuration = Exhibit.getConfigurationFromDOM(configElmt);
    var view = new Exhibit.MapView(containerElmt != null ? containerElmt : configElmt, Exhibit.UIContext.createFromDOM(configElmt, uiContext));
    Exhibit.SettingsUtilities.createAccessorsFromDOM(configElmt, Exhibit.MapView._accessorSpecs, view._accessors);
    Exhibit.SettingsUtilities.collectSettingsFromDOM(configElmt, Exhibit.MapView._settingSpecs, view._settings);
    Exhibit.MapView._configure(view, configuration);
    view._internalValidate();
    view._initializeUI();
    return view;
};
Exhibit.MapView._configure = function (view, configuration) {
    Exhibit.SettingsUtilities.createAccessors(configuration, Exhibit.MapView._accessorSpecs, view._accessors);
    Exhibit.SettingsUtilities.collectSettings(configuration, Exhibit.MapView._settingSpecs, view._settings);
    var accessors = view._accessors;
    view._getLatlng = accessors.getLatlng != null ? function (itemID, database, visitor) {
        accessors.getProxy(itemID, database, function (proxy) {
            accessors.getLatlng(proxy, database, visitor);
        });
    } : null;
};
Exhibit.MapView.lookupLatLng = function (set, addressExpressionString, outputProperty, outputTextArea, database, accuracy) {
    if (accuracy == undefined) {
        accuracy = 4;
    }
    var expression = Exhibit.ExpressionParser.parse(addressExpressionString);
    var jobs = [];
    set.visit(function (item) {
        var address = expression.evaluateSingle({"value": item}, {"value": "item"}, "value", database).value;
        if (address != null) {
            jobs.push({item: item, address: address});
        }
    });
    var results = [];
    var geocoder = new GClientGeocoder();
    var cont = function () {
        if (jobs.length > 0) {
            var job = jobs.shift();
            geocoder.getLocations(job.address, function (json) {
                if ("Placemark" in json) {
                    json.Placemark.sort(function (p1, p2) {
                        return p2.AddressDetails.Accuracy - p1.AddressDetails.Accuracy;
                    });
                }
                if ("Placemark" in json && json.Placemark.length > 0 && json.Placemark[0].AddressDetails.Accuracy >= accuracy) {
                    var coords = json.Placemark[0].Point.coordinates;
                    var lat = coords[1];
                    var lng = coords[0];
                    results.push("\t{ id: '" + job.item + "', " + outputProperty + ": '" + lat + "," + lng + "' }");
                } else {
                    var segments = job.address.split(",");
                    if (segments.length == 1) {
                        results.push("\t{ id: '" + job.item + "' }");
                    } else {
                        job.address = segments.slice(1).join(",").replace(/^\s+/, "");
                        jobs.unshift(job);
                    }
                }
                cont();
            });
        } else {
            outputTextArea.value = results.join(",\n");
        }
    };
    cont();
};
Exhibit.MapView.prototype.dispose = function () {
    this._uiContext.getCollection().removeListener(this._listener);
    this._clearOverlays();
    this._map = null;
    if (this._selectListener != null) {
        this._selectListener.dispose();
        this._selectListener = null;
    }
    this._itemIDToMarker = {};
    if (this._settings.showToolbox) {
        this._toolboxWidget.dispose();
        this._toolboxWidget = null;
    }
    this._dom.dispose();
    this._dom = null;
    this._uiContext.dispose();
    this._uiContext = null;
    this._div.innerHTML = "";
    this._div = null;
};
Exhibit.MapView.prototype._internalValidate = function () {
    var exhibit = this._uiContext.getExhibit();
    if (this._accessors.getColorKey != null) {
        if (this._settings.colorCoder != null) {
            this._colorCoder = exhibit.getComponent(this._settings.colorCoder);
        }
        if (this._colorCoder == null) {
            this._colorCoder = new Exhibit.DefaultColorCoder(this._uiContext);
        }
    }
    if (this._accessors.getSizeKey != null) {
        if (this._settings.sizeCoder != null) {
            this._sizeCoder = exhibit.getComponent(this._settings.sizeCoder);
            if ("markerScale" in this._settings) {
                this._sizeCoder._settings.markerScale = this._settings.markerScale;
            }
        }
    }
    if (this._accessors.getIconKey != null) {
        if (this._settings.iconCoder != null) {
            this._iconCoder = exhibit.getComponent(this._settings.iconCoder);
        }
    }
    if ("selectCoordinator" in this._settings) {
        var selectCoordinator = exhibit.getComponent(this._settings.selectCoordinator);
        if (selectCoordinator != null) {
            var self = this;
            this._selectListener = selectCoordinator.addListener(function (o) {
                self._select(o);
            });
        }
    }
};
Exhibit.MapView.prototype._initializeUI = function () {
    var self = this;
    var legendWidgetSettings = {};
    legendWidgetSettings.colorGradient = (this._colorCoder != null && "_gradientPoints" in this._colorCoder);
    legendWidgetSettings.colorMarkerGenerator = this._createColorMarkerGenerator();
    legendWidgetSettings.sizeMarkerGenerator = this._createSizeMarkerGenerator();
    legendWidgetSettings.iconMarkerGenerator = this._createIconMarkerGenerator();
    this._div.innerHTML = "";
    this._dom = Exhibit.ViewUtilities.constructPlottingViewDom(this._div, this._uiContext, this._settings.showSummary && this._settings.showHeader, {onResize: function () {
        google.maps.event.trigger(self._map, "resize");
    }}, legendWidgetSettings);
    if (this._settings.showToolbox) {
        this._toolboxWidget = Exhibit.ToolboxWidget.createFromDOM(this._div, this._div, this._uiContext);
    }
    var mapDiv = this._dom.plotContainer;
    mapDiv.style.height = this._settings.mapHeight + "px";
    mapDiv.className = "exhibit-mapView-map";
    this._map = this._constructGMap(mapDiv);
    this._reconstruct();
};
Exhibit.MapView.prototype._constructGMap = function (mapDiv) {
    var settings = this._settings;
    if (settings.mapConstructor != null) {
        return settings.mapConstructor(mapDiv);
    } else {
        var mapOptions = {center: new google.maps.LatLng(settings.center[0], settings.center[1]), zoom: settings.zoom, panControl: true, zoomControl: {style: google.maps.ZoomControlStyle.DEFAULT}, mapTypeId: google.maps.MapTypeId.ROADMAP};
        if (settings.size == "small") {
            mapOptions.zoomControl.style = google.maps.ZoomControlStyle.SMALL;
        } else {
            if (settings.size == "large") {
                mapOptions.zoomControl.style = google.maps.ZoomControlStyle.LARGE;
            }
        }
        if ("overviewControl" in settings) {
            mapOptions.overviewControl = settings.overviewControl;
        }
        if ("scaleControl" in settings) {
            mapOptions.scaleControl = settings.scaleControl;
        }
        if ("scrollWheelZoom" in settings && !settings.scrollWheelZoom) {
            mapOptions.scrollWheel = false;
        }
        switch (settings.type) {
            case"satellite":
                mapOptions.mapTypeId = google.maps.MapTypeId.SATELLITE;
                break;
            case"hybrid":
                mapOptions.mapTypeId = google.maps.MapTypeId.HYBRID;
                break;
            case"terrain":
                mapOptions.mapTypeId = google.maps.MapTypeId.TERRAIN;
                break;
        }
        var map = new google.maps.Map(mapDiv, mapOptions);
        google.maps.event.addListener(map, "click", function () {
            SimileAjax.WindowManager.cancelPopups();
        });
        return map;
    }
};
Exhibit.MapView.prototype._createColorMarkerGenerator = function () {
    var shape = this._settings.shape;
    return function (color) {
        return SimileAjax.Graphics.createTranslucentImage(Exhibit.MapView._markerUrlPrefix + "?renderer=map-marker&shape=" + shape + "&width=20&height=20&pinHeight=5&background=" + color.substr(1), "middle");
    };
};
Exhibit.MapView.prototype._createSizeMarkerGenerator = function () {
    var shape = this._settings.shape;
    return function (iconSize) {
        return SimileAjax.Graphics.createTranslucentImage(Exhibit.MapView._markerUrlPrefix + "?renderer=map-marker&shape=" + shape + "&width=" + iconSize + "&height=" + iconSize + "&pinHeight=0", "middle");
    };
};
Exhibit.MapView.prototype._createIconMarkerGenerator = function () {
    return function (iconURL) {
        elmt = document.createElement("img");
        elmt.src = iconURL;
        elmt.style.verticalAlign = "middle";
        elmt.style.height = "40px";
        return elmt;
    };
};
Exhibit.MapView.prototype._clearOverlays = function () {
    if (this._infoWindow) {
        this._infoWindow.setMap(null);
    }
    for (var i = 0;
         i < this._overlays.length;
         i++) {
        this._overlays[i].setMap(null);
    }
    this._overlays = [];
};
Exhibit.MapView.prototype._reconstruct = function () {
    this._clearOverlays();
    if (this._dom.legendWidget) {
        this._dom.legendWidget.clear();
    }
    if (this._dom.legendGradientWidget) {
        this._dom.legendGradientWidget.clear();
    }
    this._itemIDToMarker = {};
    var currentSize = this._uiContext.getCollection().countRestrictedItems();
    var unplottableItems = [];
    if (currentSize > 0) {
        this._rePlotItems(unplottableItems);
    }
    this._dom.setUnplottableMessage(currentSize, unplottableItems);
};
Exhibit.MapView.prototype._rePlotItems = function (unplottableItems) {
    var self = this;
    var collection = this._uiContext.getCollection();
    var database = this._uiContext.getDatabase();
    var settings = this._settings;
    var accessors = this._accessors;
    var currentSet = collection.getRestrictedItems();
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
    var addMarkerAtLocation = function (locationData) {
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
        google.maps.event.addListener(marker, "click", function () {
            self._showInfoWindow(locationData.items, null, marker);
            if (self._selectListener != null) {
                self._selectListener.fire({itemIDs: locationData.items});
            }
        });
        marker.setMap(self._map);
        self._overlays.push(marker);
        for (var x = 0;
             x < locationData.items.length;
             x++) {
            self._itemIDToMarker[locationData.items[x]] = marker;
        }
    };
    try {
        for (var latlngKey in locationToData) {
            addMarkerAtLocation(locationToData[latlngKey]);
        }
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
Exhibit.MapView.prototype._plotPolygon = function (itemID, polygonString, color, makeLatLng) {
    var coords = this._parsePolygonOrPolyline(polygonString, makeLatLng);
    if (coords.length > 1) {
        var settings = this._settings;
        var borderColor = settings.borderColor != null ? settings.borderColor : color;
        var polygon = new google.maps.Polygon({paths: coords, strokeColor: borderColor, strokeWeight: settings.borderWidth, strokeOpacity: settings.borderOpacity, fillColor: color, fillOpacity: settings.opacity});
        return this._addPolygonOrPolyline(itemID, polygon);
    }
    return null;
};
Exhibit.MapView.prototype._plotPolyline = function (itemID, polylineString, color, makeLatLng) {
    var coords = this._parsePolygonOrPolyline(polylineString, makeLatLng);
    if (coords.length > 1) {
        var settings = this._settings;
        var borderColor = settings.borderColor != null ? settings.borderColor : color;
        var polyline = new google.maps.Polyline({path: coords, strokeColor: borderColor, strokeWeight: settings.borderWidth, strokeOpacity: settings.borderOpacity});
        return this._addPolygonOrPolyline(itemID, polyline);
    }
    return null;
};
Exhibit.MapView.prototype._addPolygonOrPolyline = function (itemID, poly) {
    poly.setMap(this._map);
    this._overlays.push(poly);
    var self = this;
    var onclick = function (event) {
        self._showInfoWindow([itemID], event.latLng);
        if (self._selectListener != null) {
            self._selectListener.fire({itemIDs: [itemID]});
        }
    };
    google.maps.event.addListener(poly, "click", onclick);
    this._itemIDToMarker[itemID] = poly;
    return poly;
};
Exhibit.MapView.prototype._parsePolygonOrPolyline = function (s, makeLatLng) {
    var coords = [];
    var a = s.split(this._settings.latlngPairSeparator);
    for (var i = 0;
         i < a.length;
         i++) {
        var pair = a[i].split(",");
        coords.push(makeLatLng(parseFloat(pair[0]), parseFloat(pair[1])));
    }
    return coords;
};
Exhibit.MapView.prototype._select = function (selection) {
    var itemID = selection.itemIDs[0];
    var marker = this._itemIDToMarker[itemID];
    if (marker) {
        this._showInfoWindow([itemID], null, marker);
    }
};
Exhibit.MapView.prototype._showInfoWindow = function (items, pos, marker) {
    if (this._infoWindow) {
        this._infoWindow.setMap(null);
    }
    var content = this._createInfoWindow(items);
    var window = new google.maps.InfoWindow({content: content});
    if (pos) {
        window.setPosition(pos);
    }
    window.open(this._map, marker);
    this._infoWindow = window;
};
Exhibit.MapView.prototype._createInfoWindow = function (items) {
    return Exhibit.ViewUtilities.fillBubbleWithItems(null, items, this._uiContext);
};
Exhibit.MapView.makeCanvasIcon = function (width, height, color, label, iconImg, iconSize, settings) {
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
    var lineWidth = 1;
    var lineColor = settings.borderColor || "black";
    var alpha = settings.shapeAlpha;
    var bodyWidth = width - lineWidth;
    var bodyHeight = height - lineWidth;
    var markerHeight = height + (pin ? pinHeight : 0);
    var radius;
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = markerHeight;
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
    context.strokeStyle = lineColor;
    context.lineWidth = lineWidth;
    context.stroke();
    var shadow = drawShadow(canvas);
    if (label) {
        context.font = "bold 12pt Arial";
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.globalAlpha = 1;
        context.fillStyle = "black";
        context.fillText(label, width / 2, height / 2, width / 1.4);
    }
    return{iconURL: canvas.toDataURL(), shadowURL: shadow.toDataURL()};
};
Exhibit.MapView.makePainterIcon = function (width, height, color, label, iconURL, iconSize, settings) {
    var imageParameters = ["renderer=map-marker", "shape=" + settings.shape, "alpha=" + settings.shapeAlpha, "width=" + width, "height=" + height, "background=" + color.substr(1), "label=" + label];
    var shadowParameters = ["renderer=map-marker-shadow", "shape=" + settings.shape, "width=" + width, "height=" + height];
    var pinParameters = [];
    if (settings.pin && !(iconSize > 0)) {
        var pinHeight = settings.pinHeight;
        var pinHalfWidth = Math.ceil(settings.pinWidth / 2);
        pinParameters.push("pinHeight=" + pinHeight);
        pinParameters.push("pinWidth=" + (pinHalfWidth * 2));
    } else {
        pinParameters.push("pin=false");
    }
    if (iconURL != null) {
        imageParameters.push("icon=" + iconURL);
        if (settings.iconFit != "smaller") {
            imageParameters.push("iconFit=" + settings.iconFit);
        }
        if (settings.iconScale != 1) {
            imageParameters.push("iconScale=" + settings.iconScale);
        }
        if (settings.iconOffsetX != 1) {
            imageParameters.push("iconX=" + settings.iconOffsetX);
        }
        if (settings.iconOffsetY != 1) {
            imageParameters.push("iconY=" + settings.iconOffsetY);
        }
    }
    return{iconURL: Exhibit.MapView._markerUrlPrefix + imageParameters.concat(pinParameters).join("&") + "&.png", shadowURL: Exhibit.MapView._markerUrlPrefix + shadowParameters.concat(pinParameters).join("&") + "&.png"};
};
Exhibit.MapView._markerUrlPrefix = "http://service.simile-widgets.org/painter/painter?";
Exhibit.MapView.markerCache = {};
Exhibit.MapView._makeMarker = function (position, shape, color, iconSize, iconURL, label, settings) {
    var key = "#" + shape + "#" + color + "#" + iconSize + "#" + iconURL + "#" + label;
    var cached = Exhibit.MapView.markerCache[key];
    if (cached && (cached.settings == settings)) {
        return new google.maps.Marker({icon: cached.markerImage, shadow: cached.shadowImage, shape: cached.markerShape, position: position});
    }
    var extra = label.length * 3;
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
            markerPair = Exhibit.MapView.makeCanvasIcon(width, bodyHeight, color, label, null, iconSize, settings);
        }
        markerImage.url = markerPair.iconURL;
        shadowImage.url = markerPair.shadowURL;
        cached = Exhibit.MapView.markerCache[key] = {markerImage: markerImage, shadowImage: shadowImage, markerShape: markerShape};
        return new google.maps.Marker({icon: cached.markerImage, shadow: cached.shadowImage, shape: cached.markerShape, position: position});
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


/* olmap-view.js */
Exhibit.OLMapView = function (containerElmt, uiContext) {
    Exhibit.OLMapView._initialize();
    this._div = containerElmt;
    this._uiContext = uiContext;
    this._settings = {};
    this._accessors = {getProxy: function (itemID, database, visitor) {
        visitor(itemID);
    }, getColorKey: null, getSizeKey: null, getIconKey: null, getIcon: null};
    this._colorCoder = null;
    this._sizeCoder = null;
    this._iconCoder = null;
    this._selectListener = null;
    this._itemIDToMarker = {};
    var view = this;
    this._listener = {onItemsChanged: function () {
        view._reconstruct();
    }};
    uiContext.getCollection().addListener(this._listener);
};
Exhibit.OLMapView.contexts = {};
Exhibit.OLMapView._settingSpecs = {"latlngOrder": {type: "enum", defaultValue: "latlng", choices: ["latlng", "lnglat"]}, "latlngPairSeparator": {type: "text", defaultValue: ";"}, "center": {type: "float", defaultValue: null, dimensions: 2}, "zoom": {type: "float", defaultValue: null}, "scrollWheelZoom": {type: "boolean", defaultValue: true}, "scaleControl": {type: "boolean", defaultValue: true}, "overviewControl": {type: "boolean", defaultValue: false}, "type": {type: "enum", defaultValue: "osm", choices: ["osm", "wms", "gmap", "gsat", "ghyb", "gter", "vmap", "vsat", "vhyb", "ymap", "ysat", "yhyb"]}, "bubbleTip": {type: "enum", defaultValue: "top", choices: ["top", "bottom"]}, "mapHeight": {type: "int", defaultValue: 400}, "mapConstructor": {type: "function", defaultValue: null}, "projection": {type: "function", defaultValue: null}, "color": {type: "text", defaultValue: "#FF9000"}, "colorCoder": {type: "text", defaultValue: null}, "sizeCoder": {type: "text", defaultValue: null}, "iconCoder": {type: "text", defaultValue: null}, "selectCoordinator": {type: "text", defaultValue: null}, "iconSize": {type: "int", defaultValue: 0}, "iconFit": {type: "text", defaultValue: "smaller"}, "iconScale": {type: "float", defaultValue: 1}, "iconOffsetX": {type: "float", defaultValue: 0}, "iconOffsetY": {type: "float", defaultValue: 0}, "shape": {type: "text", defaultValue: "circle"}, "shapeWidth": {type: "int", defaultValue: 24}, "shapeHeight": {type: "int", defaultValue: 24}, "shapeAlpha": {type: "float", defaultValue: 0.7}, "pin": {type: "boolean", defaultValue: true}, "pinHeight": {type: "int", defaultValue: 6}, "pinWidth": {type: "int", defaultValue: 6}, "borderOpacity": {type: "float", defaultValue: 0.5}, "borderWidth": {type: "int", defaultValue: 1}, "borderColor": {type: "text", defaultValue: null}, "opacity": {type: "float", defaultValue: 0.7}, "sizeLegendLabel": {type: "text", defaultValue: null}, "colorLegendLabel": {type: "text", defaultValue: null}, "iconLegendLabel": {type: "text", defaultValue: null}, "markerScale": {type: "text", defaultValue: null}, "showHeader": {type: "boolean", defaultValue: true}, "showSummary": {type: "boolean", defaultValue: true}, "showFooter": {type: "boolean", defaultValue: true}, "showToolbox": {type: "boolean", defaultValue: true}, "osmURL": {type: "text", defaultValue: "http://tile.openstreetmap.org/${z}/${x}/${y}.png"}, "wmsURL": {type: "text", defaultValue: "http://labs.metacarta.com/wms/vmap0"}};
Exhibit.OLMapView._accessorSpecs = [
    {accessorName: "getProxy", attributeName: "proxy"},
    {accessorName: "getLatlng", alternatives: [
        {bindings: [
            {attributeName: "latlng", types: ["float", "float"], bindingNames: ["lat", "lng"]},
            {attributeName: "maxAutoZoom", type: "float", bindingName: "maxAutoZoom", optional: true}
        ]},
        {bindings: [
            {attributeName: "lat", type: "float", bindingName: "lat"},
            {attributeName: "lng", type: "float", bindingName: "lng"},
            {attributeName: "maxAutoZoom", type: "float", bindingName: "maxAutoZoom", optional: true}
        ]}
    ]},
    {accessorName: "getPolygon", attributeName: "polygon", type: "text"},
    {accessorName: "getPolyline", attributeName: "polyline", type: "text"},
    {accessorName: "getColorKey", attributeName: "marker", type: "text"},
    {accessorName: "getColorKey", attributeName: "colorKey", type: "text"},
    {accessorName: "getSizeKey", attributeName: "sizeKey", type: "text"},
    {accessorName: "getIconKey", attributeName: "iconKey", type: "text"},
    {accessorName: "getIcon", attributeName: "icon", type: "url"}
];
Exhibit.OLMapView._initialize = function () {
    var links = [];
    var heads = document.documentElement.getElementsByTagName("head");
    for (var h = 0;
         h < heads.length;
         h++) {
        var linkElmts = heads[h].getElementsByTagName("link");
        for (var l = 0;
             l < linkElmts.length;
             l++) {
            var link = linkElmts[l];
            if (link.rel.match(/\bexhibit\/map-painter\b/)) {
                Exhibit.OLMapView._markerUrlPrefix = link.href + "?";
            }
        }
    }
    Exhibit.OLMapView._initialize = function () {
    };
};
Exhibit.OLMapView.create = function (configuration, containerElmt, uiContext) {
    var view = new Exhibit.OLMapView(containerElmt, Exhibit.UIContext.create(configuration, uiContext));
    Exhibit.OLMapView._configure(view, configuration);
    view._internalValidate();
    view._initializeUI();
    return view;
};
Exhibit.OLMapView.createFromDOM = function (configElmt, containerElmt, uiContext) {
    var configuration = Exhibit.getConfigurationFromDOM(configElmt);
    var view = new Exhibit.OLMapView(containerElmt != null ? containerElmt : configElmt, Exhibit.UIContext.createFromDOM(configElmt, uiContext));
    Exhibit.SettingsUtilities.createAccessorsFromDOM(configElmt, Exhibit.OLMapView._accessorSpecs, view._accessors);
    Exhibit.SettingsUtilities.collectSettingsFromDOM(configElmt, Exhibit.OLMapView._settingSpecs, view._settings);
    Exhibit.OLMapView._configure(view, configuration);
    view._internalValidate();
    view._initializeUI();
    return view;
};
Exhibit.OLMapView._configure = function (view, configuration) {
    Exhibit.SettingsUtilities.createAccessors(configuration, Exhibit.OLMapView._accessorSpecs, view._accessors);
    Exhibit.SettingsUtilities.collectSettings(configuration, Exhibit.OLMapView._settingSpecs, view._settings);
    var accessors = view._accessors;
    view._getLatlng = accessors.getLatlng != null ? function (itemID, database, visitor) {
        accessors.getProxy(itemID, database, function (proxy) {
            accessors.getLatlng(proxy, database, visitor);
        });
    } : null;
};
Exhibit.OLMapView.prototype.dispose = function () {
    this._uiContext.getCollection().removeListener(this._listener);
    this._map.destroy();
    this._map = null;
    if (this._selectListener != null) {
        this._selectListener.dispose();
        this._selectListener = null;
    }
    this._itemIDToMarker = {};
    if (this._settings.showToolbox) {
        this._toolboxWidget.dispose();
        this._toolboxWidget = null;
    }
    this._dom.dispose();
    this._dom = null;
    this._uiContext.dispose();
    this._uiContext = null;
    this._div.innerHTML = "";
    this._div = null;
};
Exhibit.OLMapView.prototype._internalValidate = function () {
    var exhibit = this._uiContext.getExhibit();
    if (this._accessors.getColorKey != null) {
        if (this._settings.colorCoder != null) {
            this._colorCoder = exhibit.getComponent(this._settings.colorCoder);
        }
        if (this._colorCoder == null) {
            this._colorCoder = new Exhibit.DefaultColorCoder(this._uiContext);
        }
    }
    if (this._accessors.getSizeKey != null) {
        if (this._settings.sizeCoder != null) {
            this._sizeCoder = exhibit.getComponent(this._settings.sizeCoder);
            if ("markerScale" in this._settings) {
                this._sizeCoder._settings.markerScale = this._settings.markerScale;
            }
        }
    }
    if (this._accessors.getIconKey != null) {
        if (this._settings.iconCoder != null) {
            this._iconCoder = exhibit.getComponent(this._settings.iconCoder);
        }
    }
    if ("selectCoordinator" in this._settings) {
        var selectCoordinator = exhibit.getComponent(this._settings.selectCoordinator);
        if (selectCoordinator != null) {
            var self = this;
            this._selectListener = selectCoordinator.addListener(function (o) {
                self._select(o);
            });
        }
    }
};
Exhibit.OLMapView.prototype._initializeUI = function () {
    var self = this;
    var legendWidgetSettings = {};
    legendWidgetSettings.colorGradient = (this._colorCoder != null && "_gradientPoints" in this._colorCoder);
    legendWidgetSettings.colorMarkerGenerator = this._createColorMarkerGenerator();
    legendWidgetSettings.sizeMarkerGenerator = this._createSizeMarkerGenerator();
    legendWidgetSettings.iconMarkerGenerator = this._createIconMarkerGenerator();
    this._div.innerHTML = "";
    this._dom = Exhibit.ViewUtilities.constructPlottingViewDom(this._div, this._uiContext, this._settings.showSummary && this._settings.showHeader, {onResize: function () {
        self._map.checkResize();
    }}, legendWidgetSettings);
    if (this._settings.showToolbox) {
        this._toolboxWidget = Exhibit.ToolboxWidget.createFromDOM(this._div, this._div, this._uiContext);
    }
    var mapDiv = this._dom.plotContainer;
    mapDiv.style.height = this._settings.mapHeight + "px";
    mapDiv.className = "exhibit-mapView-map";
    this._map = this._constructMap(mapDiv);
    this._reconstruct();
};
Exhibit.OLMapView.prototype._constructMap = function (mapDiv) {
    var settings = this._settings;
    if (settings.projection != null) {
        this._projection = settings.projection();
    } else {
        this._projection = new OpenLayers.Projection("EPSG:4326");
    }
    if (settings.mapConstructor != null) {
        return settings.mapConstructor(mapDiv);
    } else {
        var map = new OpenLayers.Map({"div": mapDiv, "controls": [], "projection": new OpenLayers.Projection("EPSG:900913"), "displayProjection": this._projection, "units": "m", "numZoomLevels": 18, "maxResolution": 156543.0339, "maxExtent": new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34)});
        var osm = new OpenLayers.Layer.OSM("Street", settings.osmURL, {"wrapDateLine": true});
        osm.setVisibility(false);
        var wms = new OpenLayers.Layer.WMS("World Map", settings.wmsURL, {"layers": "basic"}, {"wrapDateLine": true});
        wms.setVisibility(false);
        var availableLayers = [osm, wms];
        var availability = {"osm": osm, "wms": wms};
        if (typeof G_HYBRID_MAP != "undefined") {
            var gmap = new OpenLayers.Layer.Google("Street (Google)", {"sphericalMercator": true});
            gmap.setVisibility(false);
            var gsat = new OpenLayers.Layer.Google("Satellite (Google)", {"type": G_SATELLITE_MAP, "sphericalMercator": true});
            gsat.setVisibility(false);
            var ghyb = new OpenLayers.Layer.Google("Street (Google)", {"type": G_HYBRID_MAP, "sphericalMercator": true});
            ghyb.setVisibility(false);
            var gter = new OpenLayers.Layer.Google("Terrain (Google)", {"type": G_PHYSICAL_MAP, "sphericalMercator": true});
            gter.setVisibility(false);
            availableLayers.push(gmap, gsat, ghyb, gter);
            availability["gmap"] = gmap;
            availability["gsat"] = gsat;
            availability["ghyb"] = ghyb;
            availability["gter"] = gter;
        }
        if (typeof VEMapStyle != "undefined") {
            var vmap = new OpenLayers.Layer.VirtualEarth("Street (Virtual Earth)", {"type": VEMapStyle.Road, "sphericalMercator": true});
            vmap.setVisibility(false);
            var vsat = new OpenLayers.Layer.VirtualEarth("Satellite (Virtual Earth)", {"type": VEMapStyle.Aerial, "sphericalMercator": true});
            vsat.setVisibility(false);
            var vhyb = new OpenLayers.Layer.VirtualEarth("Street (Virtual Earth)", {"type": VEMapStyle.Hybrid, "sphericalMercator": true});
            vhyb.setVisibility(false);
            availableLayers.push(vmap, vsat, vhyb);
            availability["vmap"] = vmap;
            availability["vsat"] = vsat;
            availability["vhyb"] = vhyb;
        }
        if (typeof YAHOO_MAP_SAT != "undefined") {
            var ymap = new OpenLayers.Layer.Yahoo("Street (Yahoo)", {"sphericalMercator": true});
            ymap.setVisibility(false);
            var ysat = new OpenLayers.Layer.Yahoo("Satellite (Yahoo)", {"type": YAHOO_MAP_SAT, "sphericalMercator": true});
            ysat.setVisibility(false);
            var yhyb = new OpenLayers.Layer.Yahoo("Yahoo Hybrid", {"type": YAHOO_MAP_HYB, "sphericalMercator": true});
            yhyb.setVisibility(false);
            availableLayers.push(ymap, ysat, yhyb);
            availability["ymap"] = ymap;
            availability["ysat"] = ysat;
            availability["yhyb"] = yhyb;
        }
        var vectors = new OpenLayers.Layer.Vector("Features", {"wrapDateLine": true});
        availableLayers.push(vectors);
        if (typeof availability[settings.type] != "undefined") {
            availability[settings.type].setVisibility(true);
        } else {
            osm.setVisibility(true);
        }
        map.addLayers(availableLayers);
        availability = null;
        availableLayers = null;
        if (settings.center != null && typeof settings.center[0] != "undefined" && typeof settings.center[1] != "undefined") {
            if (settings.zoom != null) {
                map.setCenter(new OpenLayers.LonLat(settings.center[1], settings.center[0]).transform(this._projection, map.getProjectionObject()), settings.zoom);
            } else {
                map.setCenter(new OpenLayers.LonLat(settings.center[1], settings.center[0]).transform(this._projection, map.getProjectionObject()));
            }
        }
        map.addControl(new OpenLayers.Control.PanPanel());
        if (settings.overviewControl) {
            map.addControl(new OpenLayers.Control.OverviewMap());
        }
        if (settings.scaleControl) {
            map.addControl(new OpenLayers.Control.ZoomPanel());
        }
        var self = this;
        var selectControl = new OpenLayers.Control.SelectFeature(vectors, {onSelect: function (feature) {
            self._onFeatureSelect(self, feature);
        }, onUnselect: function (feature) {
            self._onFeatureUnselect(self, feature);
        }});
        map.addControl(selectControl);
        selectControl.activate();
        map.addControl(new OpenLayers.Control.Navigation(settings.scrollWheelZoom, true, OpenLayers.Handler.MOD_SHIFT, true));
        map.addControl(new OpenLayers.Control.LayerSwitcher());
        map.events.register("click", null, SimileAjax.WindowManager.cancelPopups);
        return map;
    }
};
Exhibit.OLMapView.prototype._createColorMarkerGenerator = function () {
    var shape = this._settings.shape;
    return function (color) {
        return SimileAjax.Graphics.createTranslucentImage(Exhibit.OLMapView._markerUrlPrefix + "?renderer=map-marker&shape=" + shape + "&width=20&height=20&pinHeight=5&background=" + color.substr(1), "middle");
    };
};
Exhibit.OLMapView.prototype._createSizeMarkerGenerator = function () {
    var shape = this._settings.shape;
    return function (iconSize) {
        return SimileAjax.Graphics.createTranslucentImage(Exhibit.OLMapView._markerUrlPrefix + "?renderer=map-marker&shape=" + shape + "&width=" + iconSize + "&height=" + iconSize + "&pinHeight=0", "middle");
    };
};
Exhibit.OLMapView.prototype._createIconMarkerGenerator = function () {
    return function (iconURL) {
        elmt = document.createElement("img");
        elmt.src = iconURL;
        elmt.style.verticalAlign = "middle";
        elmt.style.height = "40px";
        return elmt;
    };
};
Exhibit.OLMapView.prototype._clearOverlays = function () {
    var vectorLayer = this._map.getLayersByClass("OpenLayers.Layer.Vector");
    if (vectorLayer.length == 1) {
        vectorLayer[0].destroyFeatures();
    }
    while (this._map.popups.length > 0) {
        this._map.removePopup(this._map.popups[0]);
    }
};
Exhibit.OLMapView.prototype._reconstruct = function () {
    this._clearOverlays();
    this._dom.legendWidget.clear();
    this._itemIDToMarker = {};
    var currentSize = this._uiContext.getCollection().countRestrictedItems();
    var unplottableItems = [];
    if (currentSize > 0) {
        this._rePlotItems(unplottableItems);
    }
    this._dom.setUnplottableMessage(currentSize, unplottableItems);
};
Exhibit.OLMapView.prototype._rePlotItems = function (unplottableItems) {
    var self = this;
    var collection = this._uiContext.getCollection();
    var database = this._uiContext.getDatabase();
    var settings = this._settings;
    var accessors = this._accessors;
    var currentSet = collection.getRestrictedItems();
    var locationToData = {};
    var hasColorKey = (accessors.getColorKey != null);
    var hasSizeKey = (accessors.getSizeKey != null);
    var hasIconKey = (accessors.getIconKey != null);
    var hasIcon = (accessors.getIcon != null);
    var hasPoints = (this._getLatlng != null);
    var hasPolygons = (accessors.getPolygon != null);
    var hasPolylines = (accessors.getPolyline != null);
    var colorCodingFlags = {mixed: false, missing: false, others: false, keys: new Exhibit.Set()};
    var sizeCodingFlags = {mixed: false, missing: false, others: false, keys: new Exhibit.Set()};
    var iconCodingFlags = {mixed: false, missing: false, others: false, keys: new Exhibit.Set()};
    var makeLatLng = settings.latlngOrder == "latlng" ? function (first, second) {
        return new OpenLayers.Geometry.Point(second, first);
    } : function (first, second) {
        return new OpenLayers.Geometry.Point(first, second);
    };
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
    var bounds, maxAutoZoom = Infinity;
    var addMarkerAtLocation = function (locationData) {
        var itemCount = locationData.items.length;
        if (!bounds) {
            bounds = new OpenLayers.Bounds();
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
        var icon = Exhibit.OLMapView._makeIcon(shape, color, iconSize, itemCount == 1 ? "" : itemCount.toString(), icon, self._settings);
        var point = new OpenLayers.Geometry.Point(locationData.latlng.lng, locationData.latlng.lat).transform(self._projection, self._map.getProjectionObject());
        var layer = self._map.getLayersByClass("OpenLayers.Layer.Vector")[0];
        var marker = new OpenLayers.Feature.Vector(point, {locationData: locationData}, {"externalGraphic": icon.url, "graphicWidth": icon.size.w, "graphicHeight": icon.size.h, "graphicXOffset": icon.offset.x, "graphicYOffset": icon.offset.y, "fillColor": "white", "fillOpacity": 1, "strokeWidth": 0});
        var popup = new OpenLayers.Popup.FramedCloud("markerPoup" + Math.floor(Math.random() * 10000), new OpenLayers.LonLat(locationData.latlng.lng, locationData.latlng.lat).transform(self._projection, self._map.getProjectionObject()), null, self._createInfoWindow(locationData.items).innerHTML, icon, true, function () {
            SimileAjax.WindowManager.cancelPopups();
            self._map.removePopup(this);
        });
        marker.popup = popup;
        popup.feature = marker;
        layer.addFeatures([marker]);
        if (maxAutoZoom > locationData.latlng.maxAutoZoom) {
            maxAutoZoom = locationData.latlng.maxAutoZoom;
        }
        bounds.extend(point);
        for (var x = 0;
             x < locationData.items.length;
             x++) {
            self._itemIDToMarker[locationData.items[x]] = marker;
        }
    };
    for (var latlngKey in locationToData) {
        addMarkerAtLocation(locationToData[latlngKey]);
    }
    if (hasColorKey) {
        var legendWidget = this._dom.legendWidget;
        var colorCoder = this._colorCoder;
        var keys = colorCodingFlags.keys.toArray().sort();
        if (settings.colorLegendLabel !== null) {
            legendWidget.addLegendLabel(settings.colorLegendLabel, "color");
        }
        if (colorCoder._gradientPoints != null) {
            var legendGradientWidget = this._dom.legendWidget;
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
        if (colorCodingFlags.mixed) {
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
    if (bounds && settings.zoom == null) {
        if (maxAutoZoom > 12) {
            maxAutoZoom = 12;
        }
        var zoom = Math.max(0, self._map.getZoomForExtent(bounds) - 1);
        zoom = Math.min(zoom, maxAutoZoom);
        self._map.zoomTo(zoom);
    } else {
        self._map.zoomTo(settings.zoom);
    }
    if (bounds && settings.center == null) {
        self._map.setCenter(bounds.getCenterLonLat());
    }
};
Exhibit.OLMapView.prototype._plotPolygon = function (itemID, polygonString, color, makeLatLng) {
    var coords = this._parsePolygonOrPolyline(polygonString, makeLatLng);
    if (coords.length > 1) {
        var settings = this._settings;
        var borderColor = settings.borderColor != null ? settings.borderColor : color;
        var polygon = new OpenLayers.Geometry.LinearRing(coords).transform(this._projection, this._map.getProjectionObject());
        var polygonStyle = {"strokeColor": borderColor, "strokeWidth": settings.borderWidth, "strokeOpacity": settings.borderOpacity, "fillColor": color, "fillOpacity": settings.opacity};
        var polygonFeature = new OpenLayers.Feature.Vector(polygon, null, polygonStyle);
        return this._addPolygonOrPolyline(itemID, polygonFeature);
    }
    return null;
};
Exhibit.OLMapView.prototype._plotPolyline = function (itemID, polylineString, color, makeLatLng) {
    var coords = this._parsePolygonOrPolyline(polylineString, makeLatLng);
    if (coords.length > 1) {
        var settings = this._settings;
        var borderColor = settings.borderColor != null ? settings.borderColor : color;
        var polyline = new OpenLayers.Geometry.LineString(coords).transform(this._projection, this._map.getProjectionObject());
        var polylineStyle = {"strokeColor": borderColor, "strokeWidth": settings.borderWidth, "strokeOpacity": settings.borderOpacity};
        var polylineFeature = new OpenLayers.Feature.Vector(polyline, null, polylineStyle);
        return this._addPolygonOrPolyline(itemID, polylineFeature);
    }
    return null;
};
Exhibit.OLMapView.prototype._addPolygonOrPolyline = function (itemID, poly) {
    var vectors = this._map.getLayersByClass("OpenLayers.Layer.Vector");
    if (vectors.length > 0) {
        var vectorLayer = vectors[0];
        vectorLayer.addFeatures([poly]);
    } else {
        return null;
    }
    var self = this;
    var centroid = poly.geometry.getCentroid();
    var popup = new OpenLayers.Popup.FramedCloud("vectorPopup" + Math.floor(Math.random() * 10000), new OpenLayers.LonLat(centroid.x, centroid.y), null, self._createInfoWindow([itemID]).innerHTML, null, true, function () {
        SimileAjax.WindowManager.cancelPopups();
        self._map.removePopup(this);
    });
    poly.popup = popup;
    popup.feature = poly;
    this._itemIDToMarker[itemID] = poly;
    return poly;
};
Exhibit.OLMapView.prototype._parsePolygonOrPolyline = function (s, makeLatLng) {
    var coords = [];
    var a = s.split(this._settings.latlngPairSeparator);
    for (var i = 0;
         i < a.length;
         i++) {
        var pair = a[i].split(",");
        coords.push(makeLatLng(parseFloat(pair[0]), parseFloat(pair[1])));
    }
    return coords;
};
Exhibit.OLMapView.prototype._onFeatureSelect = function (self, feature) {
    self._map.addPopup(feature.popup, true);
    if (self._selectListener != null) {
        self._selectListener.fire({itemIDs: feature.attributes.locationData.items});
    }
};
Exhibit.OLMapView.prototype._onFeatureUnselect = function (self, feature) {
    SimileAjax.WindowManager.cancelPopups();
    self._map.removePopup(feature.popup);
};
Exhibit.OLMapView.prototype._select = function (selection) {
    var self = this;
    var itemID = selection.itemIDs[0];
    var marker = this._itemIDToMarker[itemID];
    if (marker) {
        self._map.addPopup(marker.popup, true);
    }
};
Exhibit.OLMapView.prototype._createInfoWindow = function (items) {
    var contextId = "context" + Math.random() * 1000;
    var selfuic = this._uiContext;
    var selfdb = this._uiContext.getDatabase();
    var selfreg = this._uiContext.getLensRegistry();
    var olContext = {};
    olContext.getSetting = function (setting) {
        return selfuic.getSetting(setting);
    };
    olContext.getDatabase = function () {
        return selfdb;
    };
    olContext.getLensRegistry = function () {
        return selfreg;
    };
    olContext.isBeingEdited = function (a) {
        return false;
    };
    olContext.formatList = function (iterator, count, valueType, appender) {
        return selfuic.formatList(iterator, count, valueType, appender);
    };
    olContext.format = function (value, valueType, appender) {
        var f = new Exhibit.Formatter._ItemFormatter(olContext);
        f.format = function (v, a) {
            var title = this.formatText(v);
            Exhibit.OLMapView.contexts[contextId] = selfuic;
            var anchor = SimileAjax.DOM.createElementFromString('<a href="' + Exhibit.Persistence.getItemLink(v) + "\" class='exhibit-item' onclick='Exhibit.UI.showItemInPopup(\"" + v + '", this, Exhibit.OLMapView.contexts["' + contextId + "\"]); return false;'>" + title + "</a>");
            a(anchor);
        };
        f.format(value, appender);
    };
    return Exhibit.ViewUtilities.fillBubbleWithItems(null, items, olContext);
};
Exhibit.OLMapView._iconData = null;
Exhibit.OLMapView._markerUrlPrefix = "http://service.simile-widgets.org/painter/painter?";
Exhibit.OLMapView._defaultMarkerShape = "circle";
Exhibit.OLMapView._makeIcon = function (shape, color, iconSize, label, iconURL, settings) {
    var extra = label.length * 3;
    var halfWidth = Math.ceil(settings.shapeWidth / 2) + extra;
    var bodyHeight = settings.shapeHeight;
    var width = halfWidth * 2;
    var height = bodyHeight;
    if (iconSize > 0) {
        width = iconSize;
        halfWidth = Math.ceil(iconSize / 2);
        height = iconSize;
        bodyHeight = iconSize;
        settings.pin = false;
    }
    var icon = new Object();
    var imageParameters = ["renderer=map-marker", "shape=" + shape, "alpha=" + settings.shapeAlpha, "width=" + width, "height=" + bodyHeight, "background=" + color.substr(1), "label=" + label];
    var pinParameters = [];
    if (iconURL != null) {
        imageParameters.push("icon=" + iconURL);
        if (settings.iconFit != "smaller") {
            imageParameters.push("iconFit=" + settings.iconFit);
        }
        if (settings.iconScale != 1) {
            imageParameters.push("iconScale=" + settings.iconScale);
        }
        if (settings.iconOffsetX != 1) {
            imageParameters.push("iconX=" + settings.iconOffsetX);
        }
        if (settings.iconOffsetY != 1) {
            imageParameters.push("iconY=" + settings.iconOffsetY);
        }
    }
    if (settings.pin) {
        var pinHeight = settings.pinHeight;
        var pinHalfWidth = Math.ceil(settings.pinWidth / 2);
        height += pinHeight;
        pinParameters.push("pinHeight=" + pinHeight);
        pinParameters.push("pinWidth=" + (pinHalfWidth * 2));
        icon.iconAnchor = new OpenLayers.Pixel(-halfWidth, -height);
        icon.imageMap = [0, 0, 0, bodyHeight, halfWidth - pinHalfWidth, bodyHeight, halfWidth, height, halfWidth + pinHalfWidth, bodyHeight, width, bodyHeight, width, 0];
        icon.shadowSize = new OpenLayers.Size(width * 1.5, height - 2);
        icon.infoWindowAnchor = (settings.bubbleTip == "bottom") ? new OpenLayers.Pixel(halfWidth, height) : new OpenLayers.Pixel(halfWidth, 0);
    } else {
        pinParameters.push("pin=false");
        icon.iconAnchor = new OpenLayers.Pixel(-halfWidth, -Math.ceil(height / 2));
        icon.imageMap = [0, 0, 0, bodyHeight, width, bodyHeight, width, 0];
        icon.infoWindowAnchor = new OpenLayers.Pixel(halfWidth, 0);
    }
    icon.image = Exhibit.OLMapView._markerUrlPrefix + imageParameters.concat(pinParameters).join("&") + "&.png";
    icon.iconSize = new OpenLayers.Size(width, height);
    var olicon = new OpenLayers.Icon(icon.image, icon.iconSize, icon.iconAnchor);
    return olicon;
};


/* vemap-view.js */
Exhibit.VEMapView = function (containerElmt, uiContext) {
    this._div = containerElmt;
    this._uiContext = uiContext;
    this._settings = {};
    this._accessors = {getProxy: function (itemID, database, visitor) {
        visitor(itemID);
    }, getColorKey: null, getIcon: null};
    this._colorCoder = null;
    var view = this;
    this._listener = {onItemsChanged: function () {
        view._reconstruct();
    }};
    uiContext.getCollection().addListener(this._listener);
};
Exhibit.VEMapView._id = 1;
Exhibit.VEMapView._settingSpecs = {"center": {type: "float", defaultValue: [20, 0], dimensions: 2}, "zoom": {type: "float", defaultValue: 2}, "size": {type: "text", defaultValue: "small"}, "scaleControl": {type: "boolean", defaultValue: true}, "overviewControl": {type: "boolean", defaultValue: false}, "type": {type: "enum", defaultValue: "normal", choices: ["normal", "satellite", "hybrid"]}, "bubbleTip": {type: "enum", defaultValue: "top", choices: ["top", "bottom"]}, "mapHeight": {type: "int", defaultValue: 400}, "mapConstructor": {type: "function", defaultValue: null}, "color": {type: "text", defaultValue: "#FF9000"}, "colorCoder": {type: "text", defaultValue: null}, "iconScale": {type: "float", defaultValue: 1}, "iconOffsetX": {type: "float", defaultValue: 0}, "iconOffsetY": {type: "float", defaultValue: 0}, "shape": {type: "text", defaultValue: "circle"}, "bodyWidth": {type: "int", defaultValue: 24}, "bodyHeight": {type: "int", defaultValue: 24}, "pin": {type: "boolean", defaultValue: true}, "pinHeight": {type: "int", defaultValue: 6}, "pinWidth": {type: "int", defaultValue: 6}};
Exhibit.VEMapView._accessorSpecs = [
    {accessorName: "getProxy", attributeName: "proxy"},
    {accessorName: "getLatlng", alternatives: [
        {bindings: [
            {attributeName: "latlng", types: ["float", "float"], bindingNames: ["lat", "lng"]},
            {attributeName: "maxAutoZoom", type: "float", bindingName: "maxAutoZoom", optional: true}
        ]},
        {bindings: [
            {attributeName: "lat", type: "float", bindingName: "lat"},
            {attributeName: "lng", type: "float", bindingName: "lng"},
            {attributeName: "maxAutoZoom", type: "float", bindingName: "maxAutoZoom", optional: true}
        ]}
    ]},
    {accessorName: "getColorKey", attributeName: "marker", type: "text"},
    {accessorName: "getColorKey", attributeName: "colorKey", type: "text"},
    {accessorName: "getIcon", attributeName: "icon", type: "url"}
];
Exhibit.VEMapView.create = function (configuration, containerElmt, uiContext) {
    var view = new Exhibit.VEMapView(containerElmt, Exhibit.UIContext.create(configuration, uiContext));
    Exhibit.VEMapView._configure(view, configuration);
    view._internalValidate();
    view._initializeUI();
    return view;
};
Exhibit.VEMapView.createFromDOM = function (configElmt, containerElmt, uiContext) {
    var configuration = Exhibit.getConfigurationFromDOM(configElmt);
    var view = new Exhibit.VEMapView(containerElmt != null ? containerElmt : configElmt, Exhibit.UIContext.createFromDOM(configElmt, uiContext));
    Exhibit.SettingsUtilities.createAccessorsFromDOM(configElmt, Exhibit.VEMapView._accessorSpecs, view._accessors);
    Exhibit.SettingsUtilities.collectSettingsFromDOM(configElmt, Exhibit.VEMapView._settingSpecs, view._settings);
    Exhibit.VEMapView._configure(view, configuration);
    view._internalValidate();
    view._initializeUI();
    return view;
};
Exhibit.VEMapView._configure = function (view, configuration) {
    Exhibit.SettingsUtilities.createAccessors(configuration, Exhibit.VEMapView._accessorSpecs, view._accessors);
    Exhibit.SettingsUtilities.collectSettings(configuration, Exhibit.VEMapView._settingSpecs, view._settings);
    var accessors = view._accessors;
    view._getLatlng = function (itemID, database, visitor) {
        accessors.getProxy(itemID, database, function (proxy) {
            accessors.getLatlng(proxy, database, visitor);
        });
    };
};
Exhibit.VEMapView.prototype.dispose = function () {
    this._uiContext.getCollection().removeListener(this._listener);
    this._map = null;
    this._toolboxWidget.dispose();
    this._toolboxWidget = null;
    this._dom.dispose();
    this._dom = null;
    this._uiContext.dispose();
    this._uiContext = null;
    this._div.innerHTML = "";
    this._div = null;
};
Exhibit.VEMapView.prototype._internalValidate = function () {
    if ("getColorKey" in this._accessors) {
        if ("colorCoder" in this._settings) {
            this._colorCoder = this._uiContext.getExhibit().getComponent(this._settings.colorCoder);
        }
        if (this._colorCoder == null) {
            this._colorCoder = new Exhibit.DefaultColorCoder(this._uiContext);
        }
    }
};
Exhibit.VEMapView.prototype._initializeUI = function () {
    var self = this;
    var settings = this._settings;
    var legendWidgetSettings = "_gradientPoints" in this._colorCoder ? "gradient" : {markerGenerator: function (color) {
        var shape = "square";
        return SimileAjax.Graphics.createTranslucentImage(Exhibit.MapView._markerUrlPrefix + "?renderer=map-marker&shape=" + Exhibit.MapView._defaultMarkerShape + "&width=20&height=20&pinHeight=0&background=" + color.substr(1), "middle");
    }};
    this._div.innerHTML = "";
    this._dom = Exhibit.ViewUtilities.constructPlottingViewDom(this._div, this._uiContext, true, {}, legendWidgetSettings);
    this._toolboxWidget = Exhibit.ToolboxWidget.createFromDOM(this._div, this._div, this._uiContext);
    var mapDiv = this._dom.plotContainer;
    mapDiv.style.height = settings.mapHeight + "px";
    mapDiv.className = "exhibit-mapView-map";
    mapDiv.style.position = "relative";
    mapDiv.id = "map-" + Exhibit.VEMapView._id++;
    var settings = this._settings;
    if (settings._mapConstructor != null) {
        this._map = settings._mapConstructor(mapDiv);
    } else {
        this._map = new VEMap(mapDiv.id);
        this._map.LoadMap(new VELatLong(settings.center[0], settings.center[1]), settings.zoom);
    }
    this._reconstruct();
};
Exhibit.VEMapView.prototype._reconstruct = function () {
    var self = this;
    var collection = this._uiContext.getCollection();
    var database = this._uiContext.getDatabase();
    var settings = this._settings;
    var accessors = this._accessors;
    var originalSize = collection.countAllItems();
    var currentSize = collection.countRestrictedItems();
    var unplottableItems = [];
    this._map.DeleteAllShapeLayers();
    this._dom.legendWidget.clear();
    if (currentSize > 0) {
        var currentSet = collection.getRestrictedItems();
        var locationToData = {};
        var hasColorKey = (this._accessors.getColorKey != null);
        var hasIcon = (this._accessors.getIcon != null);
        currentSet.visit(function (itemID) {
            var latlngs = [];
            self._getLatlng(itemID, database, function (v) {
                if (v != null && "lat" in v && "lng" in v) {
                    latlngs.push(v);
                }
            });
            if (latlngs.length > 0) {
                var colorKeys = null;
                if (hasColorKey) {
                    colorKeys = new Exhibit.Set();
                    accessors.getColorKey(itemID, database, function (v) {
                        colorKeys.add(v);
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
                    } else {
                        var locationData = {latlng: latlng, items: [itemID]};
                        if (hasColorKey) {
                            locationData.colorKeys = colorKeys;
                        }
                        locationToData[latlngKey] = locationData;
                    }
                }
            } else {
                unplottableItems.push(itemID);
            }
        });
        var colorCodingFlags = {mixed: false, missing: false, others: false, keys: new Exhibit.Set()};
        var bounds, maxAutoZoom = Infinity;
        var addMarkerAtLocation = function (locationData) {
            var itemCount = locationData.items.length;
            var shape = self._settings.shape;
            var color = self._settings.color;
            if (hasColorKey) {
                color = self._colorCoder.translateSet(locationData.colorKeys, colorCodingFlags);
            }
            var icon = null;
            if (itemCount == 1) {
                if (hasIcon) {
                    accessors.getIcon(locationData.items[0], database, function (v) {
                        icon = v;
                    });
                }
            }
            var icon = Exhibit.VEMapView._makeIcon(shape, color, itemCount == 1 ? "" : itemCount.toString(), icon, self._settings);
            var layer = new VEShapeLayer();
            var point = new VELatLong(locationData.latlng.lat, locationData.latlng.lng);
            var marker = new VEShape(VEShapeType.Pushpin, point);
            var title = locationData.items[0];
            var description = self._createDescription(locationData.items);
            marker.SetCustomIcon(icon);
            marker.SetTitle(title);
            marker.SetDescription(description);
            marker.SetIconAnchor(point);
            self._map.AddShapeLayer(layer);
            layer.AddShape(marker);
        };
        for (var latlngKey in locationToData) {
            addMarkerAtLocation(locationToData[latlngKey]);
        }
        if (hasColorKey) {
            var legendWidget = this._dom.legendWidget;
            var colorCoder = this._colorCoder;
            var keys = colorCodingFlags.keys.toArray().sort();
            if (this._colorCoder._gradientPoints != null) {
                legendWidget.addGradient(this._colorCoder._gradientPoints);
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
            if (colorCodingFlags.mixed) {
                legendWidget.addEntry(colorCoder.getMixedColor(), colorCoder.getMixedLabel());
            }
            if (colorCodingFlags.missing) {
                legendWidget.addEntry(colorCoder.getMissingColor(), colorCoder.getMissingLabel());
            }
        }
    }
    this._dom.setUnplottableMessage(currentSize, unplottableItems);
};
Exhibit.VEMapView.prototype._createDescription = function (items) {
    var bubbleElmt = Exhibit.ViewUtilities.fillBubbleWithItems(null, items, this._uiContext);
    var newElmt = document.createElement("div");
    newElmt.appendChild(bubbleElmt);
    return newElmt.innerHTML;
};
Exhibit.VEMapView._iconData = null;
Exhibit.VEMapView._markerUrlPrefix = "http://simile.mit.edu/painter/painter?";
Exhibit.VEMapView._defaultMarkerShape = "circle";
Exhibit.VEMapView._makeIcon = function (shape, color, label, iconURL, settings) {
    var extra = label.length * 3;
    var halfWidth = Math.ceil(settings.bodyWidth / 2) + extra;
    var bodyHeight = settings.bodyHeight;
    var width = halfWidth * 2;
    var height = bodyHeight;
    var icon = new VECustomIconSpecification;
    var imageParameters = ["renderer=map-marker", "shape=" + shape, "width=" + width, "height=" + bodyHeight, "background=" + color.substr(1), "label=" + label];
    var pinParameters = [];
    if (iconURL != null) {
        imageParameters.push("icon=" + iconURL);
        if (settings.iconScale != 1) {
            imageParameters.push("iconScale=" + settings.iconScale);
        }
        if (settings.iconOffsetX != 1) {
            imageParameters.push("iconX=" + settings.iconOffsetX);
        }
        if (settings.iconOffsetY != 1) {
            imageParameters.push("iconY=" + settings.iconOffsetY);
        }
    }
    if (settings.pin) {
        var pinHeight = settings.pinHeight;
        var pinHalfWidth = Math.ceil(settings.pinWidth / 4);
        height += pinHeight;
        pinParameters.push("pinHeight=" + pinHeight);
        pinParameters.push("pinWidth=" + (pinHalfWidth * 2));
    } else {
        pinParameters.push("pin=false");
    }
    icon.TextContent = " ";
    icon.Image = Exhibit.MapView._markerUrlPrefix + imageParameters.concat(pinParameters).join("&");
    icon.ImageHeight = height;
    icon.ImageWidth = width;
    return icon;
};

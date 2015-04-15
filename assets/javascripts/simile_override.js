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
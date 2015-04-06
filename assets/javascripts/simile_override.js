/**
 * CWRC Exhibit Override File
 *
 * We're doing this with an override file, to simple clone and then redefine the functions.
 * This monkeypatching is the cleanest way to separate the changes we're making from the original code.
 *
 * Each function override should have a note giving some insight into the reason for the change.
 */

// Overridden in order to move the widget
Exhibit.ToolboxWidget.prototype._onContainerMouseOver = function (evt) {
    if (!this._hovering) {
        var self = this;
        var coords = SimileAjax.DOM.getPageCoordinates(this._containerElmt);
        var docWidth = document.body.offsetWidth;
        var docHeight = document.body.offsetHeight;
        var popup = document.createElement("div");

        var offsetX = 100; // widget offsets
        var offsetY = 5;

        popup.className = "exhibit-toolboxWidget-popup screen";
        popup.style.left = (coords.left + offsetX) + "px";
        popup.style.top = (coords.top + offsetY) + "px";
        //        popup.style.right = (docWidth - coords.left - this._containerElmt.offsetWidth) + "px";

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

// Overridden to move the UI element.
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
            target = Math.min(0, this.getViewWidth()/2 - orthogonalExtent);
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
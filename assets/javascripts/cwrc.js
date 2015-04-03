/**
 * CWRC Exhibit Override File
 *
 * We're doing this with an override file, to simple clone and then redefine the functions.
 * This monkeypatching is the cleanest way to separate the changes we're making from the original code.
 *
 * Each function override should have a note giving some insight into the reason for the change.
 *
 * There are also some "modules" below (eg: (function(window, undefined){...}(window))), which are for pure
 * additions, rather than transmutations, to the system.
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


(function (window, undefined) {
    var zebraStyler = function (item, database, tr) {
        if (tr.rowIndex % 2) {
            tr.style.background = '#eee';
        }
        else {
            tr.style.background = '#ccc';
        }
    };

    function toggleTimeline() {
        $('#timelineArea').toggle();
        if ($('#timelineToggle').text() == 'Show Timeline') {
            $('#timelineToggle').text('Hide Timeline');
        }
        else {
            $('#timelineToggle').text('Show Timeline');
        }
    }
}());

(function mapExtensionOverride(window, undefined) {
    function toggleMap() {
        $('#mapArea').toggle();
        if ($('#mapToggle').text() == 'Show Panel') {
            $('#historicalMapToggle').show();
            $('#mapToggle').text('Hide Panel');
        }
        else {
            $('#historicalMapToggle').hide();
            $('#mapToggle').text('Show Panel');
        }
    }

    var map;
    var oldMapViewReconstruct = Exhibit.MapView.prototype._reconstruct;
    Exhibit.MapView.prototype._reconstruct = function () {
        oldMapViewReconstruct.call(this);
        map = this._map;

        var swBound = new google.maps.LatLng(27.87, -181.56);
        var neBound = new google.maps.LatLng(81.69, -17.58);
        imageBounds = new google.maps.LatLngBounds(swBound, neBound);

        historicalOverlay = new google.maps.GroundOverlay
        (
            'maps/BNA_1854.png',
            imageBounds
        );
    };

    function addOverlay() {
        historicalOverlay.setMap(map);
    }

    function removeOverlay() {
        historicalOverlay.setMap(null);
    }

    window['toggleHistoricalMap'] = function () {
        var toggle = $('#historicalMapToggle');

        if (toggle.text() == 'Show Historical Map') {
            addOverlay();
            toggle.text('Hide Historical Map')
        } else {
            removeOverlay();
            toggle.text('Show Historical Map')
        }
    }
}(window));
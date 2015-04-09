/**
 * CWRC Exhibit Modification file
 *
 * There are some "modules" below (eg: (function(window, undefined){...}(window))), which are for pure
 * additions, rather than transmutations, to the system.
 */
var CWRC = (function (cwrc, undefined) {
    cwrc['zebraStyler'] = function (item, database, tr) {
        if (tr.rowIndex % 2) {
            tr.style.background = '#eee';
        } else {
            tr.style.background = '#ccc';
        }
    };

    // TODO: if possible, merge this with toggleMap(), and pass as parameter
    cwrc['toggleTimeline'] = function () {
        $('#timelineArea').toggle();
        if ($('#timelineToggle').text() == 'Show Timeline') {
            $('#timelineToggle').text('Hide Timeline');
        }
        else {
            $('#timelineToggle').text('Show Timeline');
        }
    };

    cwrc['toggleMap'] = function () {
        $('#mapArea').toggle();
        var toggle = $('#mapToggle');
        var historicalToggle = $('#historicalMapToggle');

        if (toggle.text() == 'Show Panel') {
            historicalToggle.show();
            toggle.text('Hide Panel');
        } else {
            historicalToggle.hide();
            toggle.text('Show Panel');
        }
    };

    // ========= Map Overlay =========

    var map;
    var oldMapViewReconstruct = Exhibit.MapView.prototype._reconstruct;
    Exhibit.MapView.prototype._reconstruct = function () {
        oldMapViewReconstruct.call(this);
        map = this._map;

        var swBound = new google.maps.LatLng(27.87, -181.56);
        var neBound = new google.maps.LatLng(81.69, -17.58);
        imageBounds = new google.maps.LatLngBounds(swBound, neBound);

//        var opts = new google.maps.GroundOverlayOptions();
//        opts.opacity =

        historicalOverlay = new google.maps.GroundOverlay(
            'maps/BNA_1854.png',
            imageBounds//,
//            opts
        );
    };

    cwrc['addOverlay'] = function () {
        historicalOverlay.setMap(map);
        cwrc.setMapOpacity();
        document.getElementById('historicalOpacityControls').style.display = "";
    };

    cwrc['removeOverlay'] = function () {
        historicalOverlay.setMap(null);
        document.getElementById('historicalOpacityControls').style.display = "none";

    };

    cwrc['toggleHistoricalMap'] = function () {
        var toggle = $('#historicalMapToggle');

        if (toggle.text().trim().toLowerCase() == 'show historical map') {
            cwrc.addOverlay();
            toggle.text('Hide Historical Map')
        } else {
            cwrc.removeOverlay();
            toggle.text('Show Historical Map')
        }
    };

    cwrc['setMapOpacity'] = function () {
        var slider = document.getElementById('historicalMapOpacity');

        historicalOverlay.setOpacity(Number(slider.value));
    };

    return cwrc;
}(CWRC || {}));
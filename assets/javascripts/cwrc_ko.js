/**
 * CWRC Exhibit Modification file
 *
 * There are some "modules" below (eg: (function(window, undefined){...}(window))), which are for pure
 * additions, rather than transmutations, to the system.
 */
var CWRC = (function (cwrc, undefined) {
    // TODO: move this to a CSS rule
    cwrc['zebraStyler'] = function (item, database, tr) {
        if (tr.rowIndex % 2) {
            tr.style.background = '#eee';
        } else {
            tr.style.background = '#ccc';
        }
    };

    // ========= Map Overlay =========


    // TODO: reenable the historical overlay
//    var map;
//    var oldMapViewReconstruct = Exhibit.MapView.prototype._reconstruct;
//    Exhibit.MapView.prototype._reconstruct = function () {
//        oldMapViewReconstruct.call(this);
//        map = this._map;
//
//        var swBound = new google.maps.LatLng(27.87, -181.56);
//        var neBound = new google.maps.LatLng(81.69, -17.58);
//        imageBounds = new google.maps.LatLngBounds(swBound, neBound);
//
//        historicalOverlay = new google.maps.GroundOverlay(
//            'assets/images/maps/BNA_1854.png',
//            imageBounds
//        );
//    };
//
//    cwrc['addOverlay'] = function () {
//        historicalOverlay.setMap(map);
//        cwrc.setMapOpacity();
//        document.getElementById('historicalOpacityControls').style.display = "";
//    };
//
//    cwrc['removeOverlay'] = function () {
//        historicalOverlay.setMap(null);
//        document.getElementById('historicalOpacityControls').style.display = "none";
//    };
//
//    cwrc['toggleHistoricalMap'] = function () {
//        var toggle = $('#historicalMapToggle');
//
//        if (toggle.text().trim().toLowerCase() == 'show historical map') {
//            cwrc.addOverlay();
//            toggle.text('Hide Historical Map')
//        } else {
//            cwrc.removeOverlay();
//            toggle.text('Show Historical Map')
//        }
//    };
//
//    cwrc['setMapOpacity'] = function () {
//        var slider = document.getElementById('historicalMapOpacity');
//
//        historicalOverlay.setOpacity(Number(slider.value));
//    };

    cwrc.data = ko.observableArray();
    cwrc.filters = ko.observableArray();
    cwrc.filteredData = ko.computed({
        read: function () {
            var filteredData = cwrc.data();

            for (var i = 0; i < cwrc.filters().length; i++) {
                var filterFunc = cwrc.filters()[i];

                filteredData = cwrc.select(filteredData, filterFunc);
            }

            return filteredData;
        },
        deferEvaluation: true});

    cwrc.select = function (data, filterBlock) {
        var result = [];

        for (var i = 0; i < data.length; i++) {
            if (filterBlock(data[i]))
                result.push(data[i]);
        }

        return result;
    };

    cwrc['loadData'] = function () {
        var dataSources = document.querySelectorAll('link[rel="cwrc/data"]');
        var loadedData = [];

        for (var i = 0; i < dataSources.length; i++) {
            var dataSource = dataSources[i].getAttribute('href');

            CWRC.Network.ajax('get', dataSource, null, function (result) {
                cwrc.data(cwrc.data().concat(result.items));
            });
        }
    };

    return cwrc;
}(CWRC || {}));

ko.bindingHandlers.dynamicHtml = {
    init: function () {
        // Mark this as controlling its own descendants
        // so that KO doesn't try to double-bind on the initial load
        return { 'controlsDescendantBindings': true };
    },

    update: function (element, valueAccessor, all, data, context) {
        ko.utils.setHtml(element, valueAccessor());

        ko.applyBindingsToDescendants(context, element);
    }
};

// To listen only for left clicks, rather than middle clicks as well.
ko.bindingHandlers.leftClick = {
    update: function (element, valueAccessor, all, data, context) {
        ko.utils.setHtml(element, valueAccessor());

        ko.applyBindingsToDescendants(context, element);
    }
};

window.addEventListener('load', function () {
    ko.applyBindings();
});

window.addEventListener('error', function (msg, url, line, col, error) {
    // Try-catch is needed to avoid infinite loops.
    try {
        window.flash('error', 'The system had an internal problem.');
    } catch (e) {
        return false;
    }
});

CWRC.loadData();


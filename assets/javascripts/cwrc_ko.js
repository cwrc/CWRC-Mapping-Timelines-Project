/**
 * CWRC Exhibit Modification file
 *
 * There are some "modules" below (eg: (function(window, undefined){...}(window))), which are for pure
 * additions, rather than transmutations, to the system.
 */
var CWRC = (function (cwrc, undefined) {
    // ========= Map Overlay =========
    cwrc.rawData = ko.observableArray();
    cwrc.filters = ko.observableArray();
    cwrc.filteredData = ko.pureComputed(function () {
        var filteredData = cwrc.rawData();

        for (var i = 0; i < cwrc.filters().length; i++) {
            var filterFunc = cwrc.filters()[i];

            filteredData = cwrc.select(filteredData, filterFunc);
        }

        return filteredData;
    });//.extend({method: 'notifyWhenChangesStop', rateLimit: 150 });

    cwrc.selected = ko.observable();

    /**
     * Filters the given data array by the given block.
     *
     * @param data An array of objects to be filtered.
     * @param filterBlock A functon that receives a datum and returns true if it meets the filtering criteria
     * @returns {Array}
     */
    cwrc['select'] = function (data, filterBlock) {
        var result = [];

        for (var i = 0; i < data.length; i++) {
            if (filterBlock(data[i]))
                result.push(data[i]);
        }

        return result;
    };

    cwrc['loadData'] = function () {
        var dataSources, dataSource, loadedData, flattenedData, finishLoading;

        dataSources = document.querySelectorAll('link[rel="cwrc/data"]');
        loadedData = [];

        for (var i = 0; i < dataSources.length; i++) {
            dataSource = dataSources[i].getAttribute('href');

            CWRC.Network.ajax('get', dataSource, null, function (result) {
                loadedData.push(result.items);

                // if this is the last one, we can finish loading.
                if (loadedData.length >= dataSources.length) {
                    flattenedData = [].concat.apply([], loadedData);
                    cwrc.rawData(flattenedData);
                }
            });
        }
    };

    /**
     * Returns all events that have a timestamp associated, sorted by start time.
     */


    cwrc.timespan = ko.pureComputed(function () {
        return ko.utils.range(CWRC.earliestDate().getUTCFullYear(), CWRC.latestDate().getUTCFullYear() - 1);
    });

    /**
     * Accepts any of:
     *   1. date string (eg. "January 1, 2015");
     *   2. event (ie. from the database, not UI event); or
     *   3. Date object;
     * and converts it into a Unix Epoch timestamp.  If the given object is an event, it will convert the startDate.
     *
     * @param data
     * @returns {number} timestamp
     */
    cwrc['toStamp'] = function (data) {
        if (data && data.startDate)     // event objects need coersion
            data = data.startDate;

        return (new Date(data)).getTime();
    };

    cwrc.toMillisec = function (unit) {
        var conversionChart = {
            minute: 60 * 1000,
            hour: 3600 * 1000,
            day: 86400 * 1000,
            month: 86400 * 31 * 1000,
            year: 31536000 * 1000
        };

        return conversionChart[unit];
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

ko.bindingHandlers.href = {
    update: function (element, valueAccessor) {
        ko.bindingHandlers.attr.update(element, function () {
            return { href: valueAccessor()}
        });
    }
};

ko.bindingHandlers.src = {
    update: function (element, valueAccessor) {
        ko.bindingHandlers.attr.update(element, function () {
            return { src: valueAccessor()}
        });
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


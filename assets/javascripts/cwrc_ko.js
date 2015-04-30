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
    cwrc.filteredData = ko.computed({
        read: function () {
            var filteredData = cwrc.rawData();

            for (var i = 0; i < cwrc.filters().length; i++) {
                var filterFunc = cwrc.filters()[i];

                filteredData = cwrc.select(filteredData, filterFunc);
            }

            return filteredData;
        },
        deferEvaluation: true});

    cwrc.selected = ko.observable();

    cwrc['select'] = function (data, filterBlock) {
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
                cwrc.rawData(cwrc.rawData().concat(result.items));
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


/**
 * CWRC PlotIt Main file
 *
 * There are some "modules" below (eg: (function(window, undefined){...}(window))), that provide some common utility functions.
 */
var CWRC = (function (cwrc, undefined) {
    // Save the original title to allow history manipulation to use it
    cwrc.pageTitle = document.title;

    cwrc.groupHistory = function (title, callback, flatten) {
        if (!flatten)
            History.pushState(History.getState().data);

        CWRC.historyGroupName = title;

        callback();

        CWRC.historyGroupName = '';
    };

    cwrc.rawData = ko.observableArray();
    cwrc.filters = ko.observableArray();
    cwrc.filteredData = ko.pureComputed(function () {
        var filteredData = cwrc.rawData();

        for (var i = 0; i < cwrc.filters().length; i++) {
            var filterFunc = cwrc.filters()[i];

            filteredData = cwrc.select(filteredData, filterFunc);
        }

        return filteredData;
    });

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


    cwrc.isLoading = ko.observable();

    cwrc['loadData'] = function () {
        var dataSources, dataSource, loadedData, flattenedData, finishLoading;

        dataSources = document.querySelectorAll('link[rel="cwrc/data"]');
        loadedData = [];

        cwrc.isLoading(true);

        for (var i = 0; i < dataSources.length; i++) {
            dataSource = dataSources[i].getAttribute('href');

            CWRC.Network.ajax('get', dataSource, null, function (result) {
                loadedData.push(result.items);

                // if this is the last one, we can finish loading.
                if (loadedData.length >= dataSources.length) {
                    flattenedData = [].concat.apply([], loadedData);

                    // Freezing all data to avoid any modifications by widgets, plus this is a read-only tool.
                    flattenedData.forEach(function (item) {
                        Object.freeze(item);
                    });

                    cwrc.rawData(flattenedData);

                    cwrc.isLoading(false);
                }
            });
        }
    };

    /**
     * Returns all records that have a timestamp associated, sorted by start time.
     */
    cwrc.timespan = ko.pureComputed(function () {
        return ko.utils.range(CWRC.earliestDate().getUTCFullYear(), CWRC.latestDate().getUTCFullYear() - 1);
    });

    /**
     * Accepts any of:
     *   1. date string (eg. "January 1, 2015");
     *   2. record; or
     *   3. Date object;
     * and converts it into a Unix Epoch timestamp.  If the given object is a record, it will convert the startDate.
     *
     * @param data
     * @returns {number} timestamp
     */
    cwrc['toStamp'] = function (data) {
        if (data && data.startDate)     // records need coersion
            data = data.startDate;

        return (new Date(data)).getTime();
    };

    cwrc.toMillisec = function (unit) {
        // unit to (avg) duration in seconds
        var conversionChart = {
            minute: 60,
            hour: 3600,
            day: 86400,
            month: 86400 * 31,
            year: 31536000,
            decade: 315360000,
            century: 3153600000,
            millennium: 31536000000
        };

        return conversionChart[unit] * 1000;
    };

    cwrc.createMarkerIcon = function (params) {
        var width, height, color, label, settings, isSelected;

        width = params['width'] || 18;
        height = params['height'] || 18;
        color = params['color'];
        label = params['label'];
        settings = params['settings'];
        isSelected = params['isSelected'];

        // TODO: might be faster to store in a hash, if possible

        var drawShadow = function (icon) {
            var width, heeight, shadowWidth, canvas, context;

            width = icon.width;
            height = icon.height;
            shadowWidth = width + height;

            canvas = document.createElement("canvas");
            canvas.width = shadowWidth;
            canvas.height = height;

            context = canvas.getContext("2d");
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
        var pinWidth = width / 3; // settings.pinWidth;
        var pinHeight = height / 3; // settings.pinHeight;
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
                context.font = "bold 12pt Arial Verdana Sans-serif";
            } else {
                context.font = "12pt Arial Verdana Sans-serif";
            }
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.globalAlpha = 1;
            context.fillStyle = "white";
            context.strokeStyle = "black";
            var w, h, max;

            w = width / 2;
            h = height / 2.5;
            max = width / 1.2;

            context.lineWidth = 2;
            context.miterLimit = 2;
            context.strokeText(label, w, h, max);
            context.fillText(label, w, h, max);
        }

        return {url: canvas.toDataURL(), shadowURL: shadow.toDataURL()};
    };

    return cwrc;
}(CWRC || {}));

/**
 * Polyfill for Internet explorer 9 & 10. Sourced from MDN:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
 */
if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}


/**
 * Polyfill for Internet explorer 9 & 10. Sourced from MDN:
 *https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
 */
if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function (predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.findIndex called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return i;
            }
        }
        return -1;
    };
}

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


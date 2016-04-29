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

            filteredData = filteredData.filter(filterFunc);
        }

        return filteredData;
    });

    cwrc.timedData = ko.pureComputed(function () {
        return CWRC.rawData().filter(function (item) {
            return item.hasStartDate() || item.hasEndDate();
        })
    });

    cwrc.earliestStamp = ko.pureComputed(function () {
        var stamps = cwrc.timedData().map(function (record) {
            return record.getStartStamp()
        });

        return stamps.length > 0 ? Math.min.apply(null, stamps) : (new Date()).getTime();
    });

    cwrc.latestStamp = ko.pureComputed(function () {
        var stamps = cwrc.timedData().map(function (record) {
            return record.getEndStamp() || record.getStartStamp()
        });

        return stamps.length > 0 ? Math.max.apply(null, stamps) : (new Date()).getTime();
    });

    cwrc.selected = ko.observable();

    cwrc.DEFAULT_FIELD_NAMES = {
        timeStartField: 'startDate',
        timeEndField: 'endDate',
        labelField: 'label'
    };

    cwrc['loadData'] = function () {
        var dataSources, dataSource, loadedData, fieldData, loader;

        dataSources = document.querySelectorAll('link[rel="cwrc/data"]');
        loadedData = [];

        loader = new CWRC.Loader();

        for (var i = 0; i < dataSources.length; i++) {
            dataSource = dataSources[i].getAttribute('href');
            eval('fieldData = {' + (dataSources[i].getAttribute('data-fields') || '') + '}');

            for (var field in cwrc.DEFAULT_FIELD_NAMES)
                if (cwrc.DEFAULT_FIELD_NAMES.hasOwnProperty(field))
                    fieldData[field] = fieldData[field] || cwrc.DEFAULT_FIELD_NAMES[field];

            CWRC.Network.ajax('get', dataSource, null, (function (fieldData) {
                // this 'extra' function wrapper to pass in fieldData locks in the value of fieldData within the ajax call.
                // if it were missing, it could allow for non-deterministic bugs.
                return function (result) {
                    loadedData.push(result.items);

                    if (loadedData.length >= dataSources.length) // ie. is this the last one to load?
                        cwrc.finishLoad(loadedData, fieldData, loader);
                }
            })(fieldData));
        }
    };

    cwrc['finishLoad'] = function (loadedData, fieldData, loader) {
        var flattenedData = [].concat.apply([], loadedData);

        flattenedData = flattenedData.map(function (rawRecord) {
            return new cwrc.DataRecord(rawRecord, fieldData);
        });

        cwrc.rawData(flattenedData);

        ko.applyBindings();

        loader.stop();
    };

    /**
     * Class that augments the raw JSON data with useful behaviours.
     */
    (function DataRecord() {
        /**
         * Builds a new DataRecord
         * @param rawData The data from the data source
         * @param fieldData Data about field names
         * @constructor
         */
        cwrc.DataRecord = function (rawData, fieldData) {
            this.__cwrcFieldData__ = fieldData;

            // TODO: can we embed a separate data object instead?
            for (var field in rawData) {
                if (rawData.hasOwnProperty(field))
                    this[field] = rawData[field];
            }

            // Freezing all source data avoids any accidental modifications by widgets.
            Object.freeze(this);
        };

        cwrc.DataRecord.prototype.getStartDate = function () {
            var date = new Date(this[this.__cwrcFieldData__.timeStartField]);

            return isNaN(date.getTime()) ? undefined : date;
        };

        cwrc.DataRecord.prototype.getEndDate = function () {
            var date = this[this.__cwrcFieldData__.timeEndField];

            return date ? new Date(date) : date;
        };

        cwrc.DataRecord.prototype.hasStartDate = function () {
            return !!this.getStartDate();
        };

        cwrc.DataRecord.prototype.hasEndDate = function () {
            return !!this.getEndDate();
        };

        cwrc.DataRecord.prototype.getStartStamp = function () {
            var date = this.getStartDate();

            return date ? date.getTime() : date;
        };

        cwrc.DataRecord.prototype.getEndStamp = function () {
            var date = this.getEndDate();

            return date ? date.getTime() : date;
        };

        cwrc.DataRecord.prototype.getLabel = function () {
            return this[this.__cwrcFieldData__.labelField] || '';
        }
    })();

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

//window.addEventListener('load', function () {
//ko.applyBindings();
//});

window.addEventListener('error', function (msg, url, line, col, error) {
    // Try-catch is needed to avoid infinite loops.
    try {
        window.flash('error', 'The system had an internal problem.');
    } catch (e) {
        return false;
    }
});

CWRC.loadData();


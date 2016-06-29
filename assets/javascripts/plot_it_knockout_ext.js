/**
 * ===================================================================================
 *                            PLOT IT KNOCKOUT EXTENSIONS
 *
 * This file is for any observable extenders, new bindings, small plugins, or any
 * other small knockout extensions.
 * ===================================================================================
 */

/**
 * Provided to allow for an element to set its content to HTML contianing a knockout component.
 *
 * For some reason, knockout internally disables this; it's not for security, nor likely for efficiency. Possibly a
 * simple oversight.
 * Developers did not respond to queries for reasoning.
 *
 * @type {{init: ko.bindingHandlers.dynamicHtml.init, update: ko.bindingHandlers.dynamicHtml.update}}
 */
ko.bindingHandlers.dynamicHtml = {
    init: function () {
        // Mark this as controlling its own descendants
        // so that KO doesn't try to double-bind on the initial load
        return {'controlsDescendantBindings': true};
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
            return {href: valueAccessor()}
        });
    }
};

ko.bindingHandlers.src = {
    update: function (element, valueAccessor) {
        ko.bindingHandlers.attr.update(element, function () {
            return {src: valueAccessor()}
        });
    }
};

/**
 * Knockout extender to enhance the behaviour of an observable.
 *
 * Initial values are loaded first from data in the URI (under the keyword stored in querySymbol), and then
 * from the value provided to the observable's constructor.
 *
 * Note: because this is altering the defaults, any rate limiting or event trigger modification
 * (eg. method: 'notifyWhenChangesStop') extenders should be applied after this one.
 *
 * @param target the Knockout observable to be extended
 * @param opts Options object including:
 *                  - querySymbol: the variable name for the query string value (required)
 *                  - label: the name of the state
 *                  - formatWith: callback function that receives the new value to target and returns the human-friendly version for use in frame title
 *                  - inUriWhen: callback function that receives a new value to target and returns true if the value should be included in the URI. Default: checks against falsey value (undefined, empty string, etc).
 *                  - compareWith: callback function that receives a two values and returns true if the values are the same. Default: returns true if ==; both are falsey; or both have length === 0 (eg. empty array).
 * @returns {*} extended target observable
 */
ko.extenders.history = function (target, opts) {
    var defaultValue, comparator, isFalsey, includeInURI, valueFormatter, valueChangeListener, historyChangeListener;

    if (opts.querySymbol == '' || opts.querySymbol == undefined)
        throw 'querySymbol is required';

    target.__updatingFromHistory__ = false;

    isFalsey = function (value) {
        // this includes empty array along with normal falsey values.
        return (value == null || value.length === 0)
    };

    comparator = opts.compareWith || function (a, b) {
            return (isFalsey(a) && isFalsey(b)) || a == b;
        };

    includeInURI = opts.inUriWhen ||
        function (value) {
            return !isFalsey(value);
        };

    valueFormatter = opts.formatWith ||
        function (value) {
            return value || '(none)';
        };

    valueChangeListener = function (newVal) {
        var data, label, uri;

        if (target.__updatingFromHistory__)
            return;

        uri = URI(location.search);
        data = History.getState().data;

        data[opts.querySymbol] = newVal;

        if (includeInURI(newVal))
            uri.setQuery(opts.querySymbol, newVal);
        else
            uri.removeQuery(opts.querySymbol);


        if (CWRC.historyGroupName) {// || data.replacers.indexOf(target.viewModel())) {
            label = (CWRC.historyGroupName == CWRC.pageTitle) ? CWRC.pageTitle : (CWRC.historyGroupName + ' - ' + CWRC.pageTitle);

            History.replaceState(data, label, uri.toString() || '?');
        } else {
            label = opts.label + ': ' + valueFormatter(newVal) + ' - ' + CWRC.pageTitle;

            History.pushState(data, label, uri.toString() || '?');
        }
    };

    historyChangeListener = function () {
        var storedValue;

        storedValue = History.getState().data[opts.querySymbol];

        if (comparator(target(), storedValue))
            return;

        target.__updatingFromHistory__ = true;
        target(storedValue);
        target.__updatingFromHistory__ = false;
    };

    defaultValue = URI.parseQuery(location.search)[opts.querySymbol] || target();

    if (target() instanceof Array && target.sort) // make sure computedObservables are wrapped in array
        defaultValue = [].concat(defaultValue);

    if (defaultValue) {
        target(defaultValue);
        CWRC.groupHistory(CWRC.pageTitle || 'Plot-It', function () {
            valueChangeListener(defaultValue);
        }, true);
    }

    History.Adapter.bind(window, 'statechange', historyChangeListener);
    target.subscribe(valueChangeListener);

    return target;
};

/**
 * Knockout extender to enhance the behaviour of an observable.
 *
 * Forces the value to be numeric, or undefined if allowed by nullable
 *
 * @param target the Knockout observable to be extended
 * @param opts Options object including:
 *                  - minValue: if supplied, forces the value to be greater than or equal to minValue.
 *                  - maxValue: if supplied, forces the value to be less than or equal to maxValue
 *                  - nullable: allows the value to become undefined or null.
 * @returns {*} extended target observable
 */
ko.extenders.number = function (target, opts) {
    var minValue, maxValue, result;

    minValue = opts['minValue'];
    maxValue = opts['maxValue'];

    if (minValue == null)
        minValue = -Infinity;

    if (maxValue == null)
        maxValue = Infinity;

    result = ko.computed({
        read: target,
        write: function (value) {
            value = parseFloat(value);

            if (isNaN(value)) {
                if (opts.nullable)
                    value = value === undefined ? undefined : null;
                else
                    value = minValue
            } else {
                if (value < minValue)
                    value = minValue;
                else if (value > maxValue)
                    value = maxValue;
            }

            target(value);
        }
    });

    return result;
};
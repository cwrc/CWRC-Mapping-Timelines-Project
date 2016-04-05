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
 * @param target the Knockout observable to be extended
 * @param opts Options object including:
 *                  - label: the name of the state
 *                  - querySymbol: the variable name for the query string value
 *                  - ignorableWhen: callback function that receives new values to target and returns true if the value is ignorable (ie. that the URI no longer include it). Defaults to checking against falsey value (undefined, empty string, etc).
 * @returns {*} extended target observable
 */
ko.extenders.history = function (target, opts) {
    target.__updatingFromHistory__ = false;

    History.Adapter.bind(window, 'statechange', function () {
        var data;

        data = History.getState().data[opts.querySymbol];

        //console.log('READ ' + opts.label + ':')
        //console.log(History.getState().data);
        //console.log('')

        if (target() != data) {
            target.__updatingFromHistory__ = true;
            target(data);
            target.__updatingFromHistory__ = false;
        }
    });

    target.__updateHistoryHandler__ = function (newVal) {
        var data, label, uri, ignoreableCallback;

        if (target.__updatingFromHistory__)
            return;

        uri = URI(location.search);
        data = History.getState().data;

        ignoreableCallback = opts.ignorableWhen ||
            function (value) {
                return !value;
            };

        if (ignoreableCallback(newVal)) {
            uri.removeSearch(opts.querySymbol);
            label = '';
        } else {
            uri.setSearch(opts.querySymbol, newVal);
            label = opts.label + ' "' + newVal + '" - ';
        }

        // TODO: base label off all search parameters? Or maybe just ignore the labelling?
        // TODO: perhaps just state which fields have been filtered, but not the values? Can't know how to format other
        // TODO: ones from within one handler.

        data[opts.querySymbol] = newVal;

        //console.log('SAVE ' + opts.label + ' Filter:')
        //console.log(stateData)
        //console.log('')

        History.pushState(data, label + 'Plot-It', uri.toString() || '?')
    };

    target.subscribe(target.__updateHistoryHandler__);
    if (target())
        target.__updateHistoryHandler__(target());

    return target;
};

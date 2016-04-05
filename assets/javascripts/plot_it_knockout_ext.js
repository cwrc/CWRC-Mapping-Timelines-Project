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
 * @param params Includes:
 *                  - label: the name of the state
 *                  - querySymbol: the variable name for the query string value
 * @returns {*} extended target observable
 */
ko.extenders.history = function (target, params) {
    target.__updatingFromHistory__ = false;

    History.Adapter.bind(window, 'statechange', function () {
        var data;

        data = History.getState().data[params.querySymbol];

        //console.log('READ ' + params.label + ':')
        //console.log(state.data);
        //console.log('')

        if (target() != data) {
            target.__updatingFromHistory__ = true;
            target(data || '');
            target.__updatingFromHistory__ = false;
        }
    });

    target.subscribe(function (newVal) {
        var data, label, uri;

        if (target.__updatingFromHistory__)
            return;

        uri = URI(location.search);
        data = {};

        // checking length covers strings and arrays
        if (newVal.length > 0) {
            uri.setSearch(params.querySymbol, newVal);
            label = params.label + ' "' + newVal + '" - ';
            data[params.querySymbol] = newVal;
        } else {
            uri.removeSearch(params.querySymbol);
            label = '';
            delete data[params.querySymbol];
        }

        //console.log('SAVE ' + params.label + ' Filter:')
        //console.log(stateData)
        //console.log('')

        History.pushState(data, label + 'Plot-It', uri.toString() || '?')
    });

    return target;
};

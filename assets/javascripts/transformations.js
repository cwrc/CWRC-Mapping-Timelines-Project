// transformations
(function (window, undefined) {
    // TODO: modularize these all to depollute the global namespace

    window.humanDate = function (stamp) {
        if (!stamp)
            return null;

        var date = new Date(stamp * 1000);
        var now = new Date();

        if (date.toLocaleDateString() == now.toLocaleDateString()) {
            // IE8 doesn't suppport:
            // date.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
            return date.getHours() + ":" +
                ('0' + date.getMinutes()).slice(-2);
        } else {
            return date.toLocaleDateString();
        }
    };

    window.humanDateTime = function (stamp) {
        if (!stamp)
            return null;

        var date = new Date(stamp * 1000);
        var now = new Date();

        if (date.toLocaleDateString() == now.toLocaleDateString()) { // same day?
            // IE8 doesn't suppport:
            // date.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
            return 'Today, ' + date.getHours() + ":" +
                ('0' + date.getMinutes()).slice(-2);
        } else {
            return date.toLocaleString();
        }
    };

    window.desymbol = function (sym) {
        return sym.replace('_', ' ');
    };

    window.toYesNo = function (value) {
        if (value)
            return "Yes";
        else
            return "No";
    };

    window.deserializeSearch = function () {
        var pairs = location.search.substring(1, location.search.length).split("&");
        var params = {};

        for (var i = 0; i < pairs.length; i++) {
            if (pairs[i]) {
                var p = pairs[i].split("=");

                params[p[0]] = decodeURIComponent(p[1]);
            }
        }

        return params
    };

    window.serializeSearch = function (paramHash) {
        var params = [];

        for (param in paramHash) {
            if (paramHash.hasOwnProperty(param)) {
                params.push(param + "=" + paramHash[param]);
            }
        }

        var serialized = params.join('&');

        return (serialized ? "?" : "") + serialized;
    };
}(window));

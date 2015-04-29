window.CWRC = window.CWRC || {};

// transformations
window.CWRC.Transform = (function (transform, undefined) {
    // TODO: modularize these all to depollute the global namespace

    transform['humanDate'] = function (stamp) {
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

    transform['humanDateTime'] = function (stamp) {
        if (!stamp)
            return null;

        var date = new Date(stamp * 1000);
        var now = new Date();

        if (date.toLocaleDateString() == now.toLocaleDateString()) { // same day?
            // IE8 doesn't suppport:
            // date.toLocalewindowTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'});
            return 'Today, ' + date.getHours() + ":" +
                ('0' + date.getMinutes()).slice(-2);
        } else {
            return date.toLocaleString();
        }
    };

    transform['desymbol'] = function (sym) {
        return sym.replace('_', ' ');
    };

    transform['deserializeSearch'] = function () {
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

    transform['serializeSearch'] = function (paramHash) {
        var params = [];

        for (param in paramHash) {
            if (paramHash.hasOwnProperty(param)) {
                params.push(param + "=" + paramHash[param]);
            }
        }

        var serialized = params.join('&');

        return (serialized ? "?" : "") + serialized;
    };

    transform['parseLatLng'] = function (string) {
        var parts = string.split(',');

        return {lat: Number(parts[0].trim()),
            lng: Number(parts[1].trim()) }
    };

    return transform;
}(CWRC.Transform || {}));
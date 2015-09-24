window.CWRC = window.CWRC || {};

// transformations
window.CWRC.Transform = (function (transform, undefined) {
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

    transform['parseLatLng'] = function (string) {
        var parts = string.split(',');

        return new google.maps.LatLng(Number(parts[0].trim()), Number(parts[1].trim()));
    };

    return transform;
}(CWRC.Transform || {}));
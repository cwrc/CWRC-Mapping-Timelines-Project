// flashes
(function (window, undefined) {
    window.notices = ko.observableArray();
    window.warnings = ko.observableArray();
    window.errors = ko.observableArray();

    // Top level should be killed after delay
    window.flash = function (listName, msgs) {
        // duration for errors to be displayed, in ms.
        var duration = 5000;
        var list;

        if (!(msgs instanceof Array))
            msgs = [msgs];

        if (listName.match(/notices?|messages?/))
            list = window.notices;
        else if (listName.match(/warnings?/)) {
            list = window.warnings;
        } else if (listName.match(/errors?/)) {
            list = window.errors;
        } else {
            throw 'Unknown flash notification list name: ' + listName;
        }

        for (var i = 0; i < msgs.length; i++) {
            list.unshift(msgs[i]);

            // TODO:  might be able to use CSS instead of timeout?
            // http://www.sitepoint.com/css3-animation-javascript-event-handlers/

            // destroy on a timer because otherwise it'll never go away.
            window.setTimeout(function () {
                list.pop();
            }, duration);
        }
    };
}(window));
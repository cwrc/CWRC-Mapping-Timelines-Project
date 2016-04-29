var CWRC = CWRC || {};

/**
 * A loading overlay throbber.
 *
 * This "widget" can't (easily) be done with KnockoutJS, because it's displaying before knockout is told to initialize.
 * KO init is delayed to allow for all the data to actually be loaded and correct before loading widgets, which allows
 * those widgets to init with sane defaults based on the real data.
 *
 * But it's a simple enough overlay anyhow, so we can skip Knocking it out, as it were.
 *
 * - remiller
 */
CWRC.Loader = function () {
    var self = this;

    self.ticks = 0;

    self.start();
};

CWRC.Loader.prototype.start = function () {
    var self = this;

    self.interval = window.setInterval(function () {
        self.ticks = self.ticks + 1;

        self.updateDots();
    }, 500);
};

CWRC.Loader.prototype.updateDots = function () {
    var dots = [];

    var dotsSpan = document.querySelector('#loading_overlay span');

    while (dots.length <= (this.ticks % 4) - 1) {
        dots.push('.');
    }

    dotsSpan.innerHTML = dots.join('');
};

CWRC.Loader.prototype.stop = function () {
    document.querySelector('#loading_overlay').style.display = 'none';

    window.clearInterval(this.interval);
};
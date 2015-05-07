ko.components.register('timeline', {
    template: '<section>\
                    <div class="labels" data-bind="foreach: years, style: {width: canvasWidth }">\
                        <div data-bind="text: $data, \
                        style: { width: $parent.labelSize - $parent.lineThickness, \
                                     \'border-left-width\': $parent.lineThickness }"></div>\
                    </div>\
                    <div class="canvas" data-bind="foreach: timelineRows, style: {width: canvasWidth }">\
                        <div class="row" data-bind="foreach: $data">\
                            <div class="event" data-bind="style: {left: $data.xPos, width: $data.width, \
                                                                color: $data.endDate ? \'red\' : \'black\'  }">\
                                <span data-bind="text: $data.startDate"></span>\
                                <span data-bind="html: $data.label"></span>\
                            </div>\
                        </div>\
                    </div>\
                    \
               </section>',
    viewModel: function () {
        var self = this;

        self.lineThickness = 1; // in px

        // the number of seconds per pixel
        var inMillisec = {
            minute: 60 * 1000,
            hour: 3600 * 1000,
            day: 86400 * 1000,
            month: 86400 * 31 * 1000,
            year: 31536000 * 1000
        };
        self.pixelsPerMs = 1 / inMillisec['day'];
        self.labelSize = inMillisec['year'] * self.pixelsPerMs; // px

        self.earliestDate = (new Date('1620')).getTime(); // TODO: compute this
        self.latestDate = (new Date('2016')).getTime(); // TODO: compute this

        self['years'] = ko.computed(function () {
            // TODO: compute using the actual span
            return ko.utils.range((new Date('1620')).getUTCFullYear(), (new Date('2016')).getUTCFullYear() - 1);
        });

        self['toStamp'] = function (dateString) {
            // autoconvert event objects
            if (dateString && dateString.startDate) {
                dateString = dateString.startDate
            }

            return (new Date(dateString)).getTime();
        };

        self['toMs'] = function (pixels) {
            return pixels / self.pixelsPerMs;
        };

        self['toPixels'] = function (stamp) {
            return stamp * self.pixelsPerMs;
        };

        self['eventIndexAfter'] = function (cutoff, events) {
            for (var i = 0; i < events.length; i++) {
                var event = events[i];

                if (self.toStamp(event) >= cutoff)
                    return i;
            }
        };

        self['events'] = ko.computed(function () {
            var events = CWRC.select(CWRC.filteredData(), function (item) {
                return item.startDate;
            }).sort(function (a, b) {
                var timeDiff = (new Date(a.startDate)).getTime() - (new Date(b.startDate)).getTime();

                // breaking ties alphabetically gives consitent results
                if (timeDiff == 0) {
                    if (a.label < b.label)
                        return -1;
                    else if (a.label > b.label)
                        return 1;
                    else
                        return 0;
                } else {
                    return timeDiff;
                }
            });

            return events;
        });

        self.timelineRows = ko.computed(function () {
            var rows = [];
            var events = self.events();

            var cutoff;
            var rowIndex = -1;

            while (events.length > 0) {
                var beyond = cutoff > self.toStamp(events[events.length - 1]);

                if (typeof cutoff === 'undefined' || beyond) {
                    cutoff = self.toStamp(events[0]);
                    rows[++rowIndex] = [];
                }

                var event;
                var eventIndex = self.eventIndexAfter(cutoff, events);

                event = events.splice(eventIndex, 1)[0];

                var startStamp = self.toStamp(event.startDate);
                var endStamp = self.toStamp(event.endDate) || startStamp;

                // duration can be artificially set to labelsize to ensure there's enough room for a label
                var duration = Math.max(Math.abs(endStamp - startStamp), self.toMs(self.labelSize));

                event.xPos = self.toPixels(startStamp - self.earliestDate);
                event.width = self.toPixels(duration);

                cutoff = startStamp + duration;

                rows[rowIndex].push(event);
            }

            return rows;
        });

        self['canvasWidth'] = ko.computed(function () {
            var events = self.events();

            if (self.earliestDate == self.latestDate) {
                return '100%';
            } else {
                var timespan = (self.latestDate - self.earliestDate);

                return timespan * self.pixelsPerMs; // gives px width
            }
        });
    }
});
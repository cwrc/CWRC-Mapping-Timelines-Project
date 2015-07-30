ko.components.register('timeline', {
    template: '<section id="timeline-section" data-bind="event:{mousedown: dragStart}">\
                    <div class="labels" data-bind="foreach: years, style: {width: canvasWidth }">\
                        <div data-bind="text: $data, style: { \
                                                            width: $parent.labelSize - $parent.lineThickness, \
                                     \'border-left-width\': $parent.lineThickness }"></div>\
                    </div>\
                    <div class="canvas" data-bind="foreach: timelineRows, style: {width: canvasWidth }">\
                        <div class="row" data-bind="foreach: $data">\
                            <a href="#" class="event" data-bind="style: {left: $data.xPos, width: $data.width,\
                                                                         color: $data.endDate ? \'red\' : \'black\'},\
                                                                 click: function(){ CWRC.selected($data) }">\
                                <span data-bind="text: $data.startDate"></span>\
                                <span data-bind="html: $data.label"></span>\
                            </a>\
                        </div>\
                    </div>\
               </section>',
    viewModel: function () {
        var self = this;

        self.previousDragEvent = ko.observable();

        self.lineThickness = 1; // in px

        self.pixelsPerMs = 1 / CWRC.toMillisec('day');
        self.labelSize = CWRC.toMillisec('year') * self.pixelsPerMs; // px

        // full filtered events, sorted by
        self.events = ko.computed(function () {
            var events, timeDiff;

            // fetch only the data that have non-null start dates, sort by start date.
            events = CWRC.select(CWRC.filteredData(), function (item) {
                return item.startDate;
            }).sort(function (a, b) {
                timeDiff = CWRC.toStamp(a) - CWRC.toStamp(b);

                if (timeDiff == 0)
                    return a.label.localeCompare(b.label); // break ties alphabetically for determinism
                else
                    return timeDiff;
            });

            return events;
        });

        self.earliestDate = ko.computed(function () {
            var firstEvent = self.events()[0];

            return firstEvent ? new Date(firstEvent.startDate) : new Date();
        });

        self.latestDate = ko.computed(function () {
            var sortedEvents = self.events();
            var lastEvent = sortedEvents[sortedEvents.size];

            return lastEvent ? new Date(lastEvent.endDate || lastEvent.startDate) : new Date();
        });

        self.years = ko.computed(function () {
            return ko.utils.range(self.earliestDate().getUTCFullYear(), self.latestDate().getUTCFullYear() - 1);
        });

        self.timelineRows = ko.computed(function () {
            var startStamp, endStamp, duration, rows, events, cutoff, rowIndex, toMilliSecs, toPixels, nextEventIndex;

            events = self.events().slice(); // slice to duplicate array, otherwise we would alter the cached value
            rows = [];
            rowIndex = -1;

            nextEventIndex = function (cutoff, events) {
                for (var i = 0; i < events.length; i++) {
                    if (CWRC.toStamp(events[i]) >= cutoff)
                        return i;
                }
            };

            toMilliSecs = function (pixels) {
                return pixels / self.pixelsPerMs;
            };

            toPixels = function (stamp) {
                return stamp * self.pixelsPerMs;
            };

            while (events.length > 0) {
                var event, eventIndex, beyond;

                beyond = cutoff > CWRC.toStamp(events[events.length - 1]);

                if (typeof cutoff === 'undefined' || beyond) {
                    cutoff = CWRC.toStamp(events[0]);
                    rows[++rowIndex] = [];
                }

                eventIndex = nextEventIndex(cutoff, events);

                event = events.splice(eventIndex, 1)[0];

                startStamp = CWRC.toStamp(event.startDate);
                endStamp = CWRC.toStamp(event.endDate) || startStamp;

                // duration can be artificially set to labelsize to ensure there's enough room for a label
                duration = Math.max(Math.abs(endStamp - startStamp), toMilliSecs(self.labelSize));

                event.xPos = toPixels(startStamp - CWRC.toStamp(self.earliestDate()));
                event.width = toPixels(duration);

                cutoff = startStamp + duration;

                rows[rowIndex].push(event);
            }

            return rows;
        });

        self.canvasWidth = ko.computed(function () {
            var events, timespan, startStamp, endStamp;

            events = self.events();
            startStamp = CWRC.toStamp(self.earliestDate());
            endStamp = CWRC.toStamp(self.latestDate());

            if (startStamp == endStamp) {
                return '100%';
            } else {
                timespan = (endStamp - startStamp); // in ms

                return timespan * self.pixelsPerMs; // convert to px
            }
        });

        self['dragStart'] = function (element, event) {
            self.previousDragEvent(event);
        };

        self.unplottable = ko.computed(function () {
            // TODO: reenable this
            return 'x';//CWRC.filteredData().length - self.visibleMarkers().length;
        });

        // Note: These are on window rather than the component so that dragging doesn't cut off when the
        // mouse leaves the widget. This is Google Maps behaviour adopted for consistency.
        window.addEventListener('mouseup', function (mouseEvent) {
            self.previousDragEvent(null);
        });

        window.addEventListener('mousemove', function (mouseEvent) {
            var src;

            if (!self.previousDragEvent())
                return;

            src = document.getElementById('timeline-section');

            // would've used even.movementX, but at this time it does not exist in Firefox.
            src.scrollTop -= mouseEvent.screenY - self.previousDragEvent().screenY;
            src.scrollLeft -= mouseEvent.screenX - self.previousDragEvent().screenX;

            self.previousDragEvent(mouseEvent);
        });
    }
});
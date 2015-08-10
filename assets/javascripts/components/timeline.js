ko.components.register('timeline', {
    template: '<section>\
                    <a href="#" data-bind="click: function(){isVisible(!isVisible())}, text: visibleText"></a>\
                    <div>\
                        <span data-bind="text: unplottableCount"></span> of <span data-bind="text: CWRC.rawData().length"></span>\
                        lack time data\
                    </div>\
               </section>\
               <div data-bind="visible: isVisible, event:{mousedown: dragStart}">\
                    <section id="timeline-viewport">\
                        <div class="canvas" data-bind="foreach: timelineRows, style: {width: canvasWidth }">\
                            <div class="row" data-bind="foreach: $data">\
                                <a href="#" class="event" data-bind="style: {\
                                                                                left: $parents[1].getPinInfo($data).xPos, \
                                                                                width: $parents[1].getPinInfo($data).width,\
                                                                                color: $data.endDate ? \'red\' : \'black\'\
                                                                            },\
                                                                     click: function(){ CWRC.selected($data) }">\
                                    <span data-bind="text: $data.startDate"></span>\
                                    <span data-bind="html: $data.label"></span>\
                                </a>\
                            </div>\
                        </div>\
                    </section>\
                    <section id="timeline-ruler">\
                        <div data-bind="foreach: years, style: { width: canvasWidth }">\
                            <div data-bind="text: $data, \
                                            style: { \
                                                     left: $parent.labelPosition($data),\
                                                     width: $parent.labelSize - $parent.lineThickness, \
                                                    \'border-left-width\': $parent.lineThickness \
                                            }"></div>\
                        </div>\
                    </section>\
               </div>',
    viewModel: function () {
        var self = this;

        self.isVisible = ko.observable(true);
        self.visibleText = ko.computed(function () {
            return self.isVisible() ? 'Hide' : 'Show';
        });

        self.previousDragEvent = ko.observable();

        self.lineThickness = 1; // in px

        self.pixelsPerMs = 1 / CWRC.toMillisec('day');
        self.labelSize = CWRC.toMillisec('year') * self.pixelsPerMs; // px
        self.eventsToPinInfos = Object.create(null);

        // full filtered events, sorted by start
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
            return ko.utils.range(self.earliestDate().getUTCFullYear(), self.latestDate().getUTCFullYear());
        });

        self['toPixels'] = function (stamp) {
            return stamp * self.pixelsPerMs;
        };

        self['originStamp'] = function () {
            return CWRC.toStamp(self.years()[0].toString());
        };

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

            toPixels = self.toPixels;

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

                self.eventsToPinInfos[ko.toJSON(event)] = {
                    xPos: toPixels(startStamp - self.originStamp()),
                    width: toPixels(duration)
                };

                cutoff = startStamp + duration;

                rows[rowIndex].push(event);
            }

            return rows;
        });

        self.canvasWidth = ko.computed(function () {
            var timespan, startStamp, endStamp;

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

        self['labelPosition'] = function (year) {
            return self.toPixels(CWRC.toStamp(year.toString()) - self.originStamp())
        };

        self['getPinInfo'] = function (item) {
            return self.eventsToPinInfos[ko.toJSON(item)];
        };

        self.unplottableCount = ko.pureComputed(function () {
            return CWRC.rawData().length - CWRC.select(CWRC.rawData(), function (item) {
                return item.startDate;
            }).length;
        });

        // Note: These are on window rather than the component so that dragging doesn't cut off when the
        // mouse leaves the widget. This is Google Maps behaviour adopted for consistency.
        window.addEventListener('mouseup', function (mouseEvent) {
            self.previousDragEvent(null);
        });

        window.addEventListener('mousemove', function (mouseEvent) {
            var viewport, ruler;

            if (!self.previousDragEvent())
                return;

            viewport = document.getElementById('timeline-viewport');
            ruler = document.getElementById('timeline-ruler');

            // would've used even.movementX, but at this time it does not exist in Firefox.
            viewport.scrollTop -= mouseEvent.screenY - self.previousDragEvent().screenY;
            viewport.scrollLeft -= mouseEvent.screenX - self.previousDragEvent().screenX;

            ruler.scrollLeft -= mouseEvent.screenX - self.previousDragEvent().screenX;

            self.previousDragEvent(mouseEvent);
        });
    }
});
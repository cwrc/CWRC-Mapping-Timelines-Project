ko.components.register('date_filter', {
    template: '<header>\
                    <span data-bind="text: label">\
                    </span>\
                    (<span data-bind="text: rangeMinDate"></span> - <span data-bind="text: rangeMaxDate"></span>)\
               </header>\
               <div id="time_filter"></div>',

    /**
     * A date-range slider filter.
     *
     * @param label: The label to display
     */
    viewModel: function (params) {
        var self = this;

        self.label = params['label'] || 'Date Range';

        self.rangeMin = ko.observable();
        self.rangeMax = ko.observable();

        // separated because we don't want to filter until after the slider is done moving, but
        // we do want to update the displayed min/dax dates live.
        // Throttling the update can still become sluggish if the user pauses for a second.
        self.rangeMinDisplay = ko.observable();
        self.rangeMaxDisplay = ko.observable();

        self.rangeMinDate = ko.pureComputed(function () {
            return (new Date(Number(self.rangeMinDisplay()))).toLocaleDateString();
        });

        self.rangeMaxDate = ko.pureComputed(function () {
            return (new Date(Number(self.rangeMaxDisplay()))).toLocaleDateString();
        });

        // TODO: there's a lot to DRY between this and Timeline.
        self.timedEvents = ko.pureComputed(function () {
            var events, timeDiff;

            // fetch only the data that have non-null start dates, sort by start date.
            events = CWRC.select(CWRC.rawData(), function (item) { // TODO: <- filteredData in timeline; pretty much only diff
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

        self.earliestDate = ko.pureComputed(function () {
            var firstEvent = self.timedEvents()[0];

            return firstEvent ? new Date(firstEvent.startDate) : new Date();
        });

        self.latestDate = ko.pureComputed(function () {
            var sortedEvents = self.timedEvents();
            var lastEvent = sortedEvents[sortedEvents.length - 1];

            return lastEvent ? new Date(lastEvent.endDate || lastEvent.startDate) : new Date();
        });

        // Tried with subscribe, but it ends up out of order. Making a computed fixes the order problem.
        self.sliderElement = ko.computed(function () {
            var sliderElement = document.getElementById('time_filter');

            if (sliderElement.noUiSlider) {
                sliderElement.noUiSlider.destroy();
            }

            // TODO: can refactor this out.
            var earliestStamp = self.earliestDate().getTime();
            var latestStamp = self.latestDate().getTime();

            var sliderSettings = {
                start: [earliestStamp, latestStamp], //[self.rangeMin(), self.rangeMax()],
                connect: true,
                margin: 1, // no closer than 1 together
                step: 1, // snap to 1-unit increments
                range: {
                    min: earliestStamp, //self.rangeMin(),
                    max: latestStamp //self.rangeMax()
                },
                pips: {
                    mode: 'positions',
                    values: [0, 20, 40, 60, 80, 100],
                    density: 2,
                    format: {
                        to: function (value) {
                            return new Date(value).getFullYear().toString();
                        },
                        from: function (value) {
                            return value.getTime();
                        }
                    }
                }
            };

            noUiSlider.create(sliderElement, sliderSettings);

            sliderElement.noUiSlider.on('set', function (value) {
                self.rangeMin(parseInt(value[0]));
                self.rangeMax(parseInt(value[1]));
            });

            sliderElement.noUiSlider.on('update', function (value) {
                self.rangeMinDisplay(parseInt(value[0]));
                self.rangeMaxDisplay(parseInt(value[1]));
            });

            sliderElement.noUiSlider.set(
                [self.rangeMin(earliestStamp), self.rangeMax(latestStamp)]
            );

            return sliderElement;
        });

        self['filter'] = function (item) {
            if (item.startDate || item.endDate) {
                var startStamp = CWRC.toStamp(item.startDate);
                var endStamp = CWRC.toStamp(item.endDate);

                return startStamp >= self.rangeMin() && startStamp <= self.rangeMax()
                    || endStamp >= self.rangeMin() && endStamp <= self.rangeMax()
            } else {
                return true; // this filter doesn't apply if there is no date data
            }
        };

        self['reset'] = function () {
            var sliderElement = document.getElementById('time_filter');

            var earliestStamp = self.earliestDate().getTime();
            var latestStamp = self.latestDate().getTime();

            sliderElement.noUiSlider.set([earliestStamp, latestStamp]);
        };

        CWRC.filters.push(self['filter']);
    }
})
;
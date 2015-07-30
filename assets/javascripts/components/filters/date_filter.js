ko.components.register('date_filter', {
    template: '<header>\
                    <span data-bind="text: label">\
                    </span>\
                    (<a href="#" data-bind="click: function(){ enabled(!enabled()) }, text: enableText"></a>)\
               </header>\
               <div ><!--TODO: histogram, probably KO component-->\
               </div>\
               <div id="time_filter"></div>',

    viewModel: function (params) {
        var self = this;

        self.label = params['label'] || 'Date Range';

        self.rangeMin = ko.observable();
        self.rangeMax = ko.observable();

        self.enabled = ko.observable(true);
        self.enableText = ko.pureComputed(function () {
            return self.enabled() ? 'on' : 'off';
        });

        // Not sure why, but we can't do the normal KO thing here. Possible that the slider library overwrites the node
        self.enabled.subscribe(function (newValue) {
            var sliderElement = document.getElementById('time_filter');

            if (!newValue)
                sliderElement.setAttribute('disabled', true);
            else
                sliderElement.removeAttribute('disabled');
        });

        // TODO: there's a lot to DRY between this and Timeline.
        self.timedEvents = ko.pureComputed(function () {
            var events, timeDiff;

            // fetch only the data that have non-null start dates, sort by start date.
            events = CWRC.select(CWRC.rawData(), function (item) { // TODO: is filtered in timeline; pretty much only diff
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

            var earliestStamp = self.earliestDate().getTime();
            var latestStamp = self.latestDate().getTime();

//            self.rangeMin(earliestStamp);
//            self.rangeMax(latestStamp);

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

            sliderElement.noUiSlider.set(
                [self.rangeMin(earliestStamp), self.rangeMax(latestStamp)]
            );

            return sliderElement;
        });

        self['filter'] = function (item) {
            if (!self.enabled())
                return true;

            if (item.startDate || item.endDate) {
                var startStamp = CWRC.toStamp(item.startDate);
                var endStamp = CWRC.toStamp(item.endDate);

                return startStamp >= self.rangeMin() && startStamp <= self.rangeMax()
                    || endStamp >= self.rangeMin() && endStamp <= self.rangeMax()
            } else {
                return true; // this filter doesn't apply if there is no date data
            }
        };

        CWRC.filters.push(self['filter']);
    }
})
;
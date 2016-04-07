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

        // TODO: there's a lot to DRY between this and Timeline.
        self.timedRecords = ko.pureComputed(function () {
            var records, timeDiff;

            // fetch only the data that have non-null start dates, sort by start date.
            records = CWRC.select(CWRC.rawData(), function (item) { // TODO: <- filteredData in timeline; pretty much only diff
                return item.startDate;
            }).sort(function (a, b) {
                timeDiff = CWRC.toStamp(a) - CWRC.toStamp(b);

                if (timeDiff == 0)
                    return a.label.localeCompare(b.label); // break ties alphabetically for determinism
                else
                    return timeDiff;
            });

            return records;
        });

        self.earliestDate = ko.pureComputed(function () {
            var firstRecord = self.timedRecords()[0];

            return firstRecord ? new Date(firstRecord.startDate) : new Date();
        });

        self.latestDate = ko.pureComputed(function () {
            var sortedRecords = self.timedRecords();
            var lastRecord = sortedRecords[sortedRecords.length - 1];

            return lastRecord ? new Date(lastRecord.endDate || lastRecord.startDate) : new Date();
        });

        // TODO: add extender to auto convert to int? would remove the parseInt calls
        self.rangeMin = ko.observable(self.earliestDate().getTime()).extend({
            history: {
                label: 'After',
                querySymbol: 'rangeMin',
                inUriWhen: function (value) {
                    return value != self.earliestDate().getTime();
                },
                formatWith: function (value) {
                    return CWRC.Transform.humanDateTime(value / 1000);
                },
                compareWith: function (a, b) {
                    return !a || !b || a === b;
                }
            }
        });
        self.rangeMax = ko.observable(self.latestDate().getTime()).extend({
            history: {
                label: 'Before',
                querySymbol: 'rangeMax',
                inUriWhen: function (value) {
                    return value != self.latestDate().getTime();
                },
                formatWith: function (value) {
                    return CWRC.Transform.humanDateTime(value / 1000);
                },
                compareWith: function (a, b) {
                    return !a || !b || a === b;
                }
            }
        });

        /**
         * This is separated from rangeMin/Max because we don't want to filter until after the slider is
         * done moving, but we *do* want to update the displayed min/dax dates immediately.
         *
         * The other options, throttling the update, can still be too sluggish if the user hesitates for a second.
         */
        self.rangeMinDisplay = ko.observable();
        self.rangeMaxDisplay = ko.observable();

        // TODO: probably would be better to merge rangeMinDate and rangeMinDisplay (and maxes) into writable computed
        self.rangeMinDate = ko.pureComputed(function () {
            return (new Date(Number(self.rangeMinDisplay()))).toLocaleDateString();
        });

        self.rangeMaxDate = ko.pureComputed(function () {
            return (new Date(Number(self.rangeMaxDisplay()))).toLocaleDateString();
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
                start: [self.rangeMin(), self.rangeMax()],// [earliestStamp, latestStamp], //[self.rangeMin(), self.rangeMax()],
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
});

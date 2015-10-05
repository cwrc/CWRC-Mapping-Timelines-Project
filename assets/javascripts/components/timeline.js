ko.components.register('timeline', {
    template: {element: 'timeline-template'},

    /**
     * A timeline with markers at each time point in the data set.
     *
     * Records with multiple locations have all markers "linked", so that selecting one will highlight all.
     */
    viewModel: function () {
        var self = this;

        self.previousDragPosition = null;

        self.lineThickness = 1; // in px

        self.pixelsPerMs = 1 / CWRC.toMillisec('day');
        self.labelSize = CWRC.toMillisec('year') * self.pixelsPerMs; // px
        self.recordsToPinInfos = Object.create(null);

        self.scaleX = ko.observable(1.0);
        self.scaleY = ko.observable(1.0);

        self.translateX = ko.observable(0);
        self.translateY = ko.observable(0);

        self.transformOriginX = ko.observable(0);
        self.transformOriginY = ko.observable(0);

        self.transformOrigin = ko.computed(function () {
            return self.transformOriginX() + 'px ' + self.transformOriginY() + 'px';
        });

        self.rulerTransform = ko.computed(function () {
            return 'scaleX(' + self.scaleX() + ')';
        });

        self.zoomTransform = ko.computed(function () {
            return 'scale(' + self.scaleX() + ',' + self.scaleY() + ')';
        });

        self.scroll = function (viewModel, scrollEvent) {
            self.scale(-scrollEvent.deltaY);

            return false; // prevent regular page scrolling.
        };

        //document.querySelector('#timeline-viewport').addEventListener('mousemove', function (e) {
        //    console.log('(' + e.screenX + ',' + e.screenY + ')')
        //});

        // full filtered records, sorted by start
        self.records = ko.computed(function () {
            var records, timeDiff;

            // fetch only the data that have non-null start dates, sort by start date.
            records = CWRC.select(CWRC.filteredData(), function (item) {
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

        self.earliestDate = ko.computed(function () {
            var firstRecord = self.records()[0];

            return firstRecord ? new Date(firstRecord.startDate) : new Date();
        });

        self.latestDate = ko.computed(function () {
            var sortedRecords = self.records();
            var lastRecord = sortedRecords[sortedRecords.size];

            return lastRecord ? new Date(lastRecord.endDate || lastRecord.startDate) : new Date();
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
            var startStamp, endStamp, duration, rows, records, cutoff, rowIndex, toMilliSecs, toPixels, nextRecordIndex;

            records = self.records().slice(); // slice to duplicate array, otherwise we would alter the cached value
            rows = [];
            rowIndex = -1;

            nextRecordIndex = function (cutoff, records) {
                for (var i = 0; i < records.length; i++) {
                    if (CWRC.toStamp(records[i]) >= cutoff)
                        return i;
                }
            };

            toMilliSecs = function (pixels) {
                return pixels / self.pixelsPerMs;
            };

            toPixels = self.toPixels;

            while (records.length > 0) {
                var record, recordIndex, beyond;

                beyond = cutoff > CWRC.toStamp(records[records.length - 1]);

                if (typeof cutoff === 'undefined' || beyond) {
                    cutoff = CWRC.toStamp(records[0]);
                    rows[++rowIndex] = [];
                }

                recordIndex = nextRecordIndex(cutoff, records);

                record = records.splice(recordIndex, 1)[0];

                startStamp = CWRC.toStamp(record.startDate);
                endStamp = CWRC.toStamp(record.endDate) || startStamp;

                // duration can be artificially set to label size to ensure there's enough room for a label
                duration = Math.max(Math.abs(endStamp - startStamp), toMilliSecs(self.labelSize));

                self.recordsToPinInfos[ko.toJSON(record)] = {
                    xPos: toPixels(startStamp - self.originStamp()),
                    width: toPixels(duration)
                };

                cutoff = startStamp + duration;

                rows[rowIndex].push(record);
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

                return (timespan * self.pixelsPerMs) + (self.pixelsPerMs * CWRC.toMillisec('year')); // convert to px
            }
        });

        self.labelPosition = function (year) {
            return self.toPixels(CWRC.toStamp(year.toString()) - self.originStamp())
        };

        self.getPinInfo = function (item) {
            return self.recordsToPinInfos[ko.toJSON(item)];
        };

        self.unplottableCount = ko.pureComputed(function () {
            return CWRC.rawData().length - CWRC.select(CWRC.rawData(), function (item) {
                    return item.startDate;
                }).length;
        });

        self.isSelected = function (record) {
            return record == CWRC.selected();
        };

        CWRC.selected.subscribe(function (selectedRecord) {
            var viewport, recordLabel, row, col, rows, records, ruler;

            rows = self.timelineRows();

            // this is awful, but is so far the only way to find the event label.
            // applying an ID is arbitrary *and* fragile, and no other unique data exists.
            // So we just rely on he expected correlation of their location because this class
            // is also doing the layout. - remiller
            for (row = 0; row < rows.length; row++) {
                records = rows[row];

                for (col = 0; col < records.length; col++) {
                    var record = records[col];

                    if (record === selectedRecord) {
                        recordLabel = document.querySelector('#timeline-viewport .row:nth-of-type(' + (row + 1) + ') .event:nth-of-type(' + (col + 1) + ')'); // gets the first one

                        break;
                    }
                }

                if (recordLabel)
                    break;
            }

            viewport = document.getElementById('timeline-viewport');
            ruler = document.getElementById('timeline-ruler');

            if (recordLabel) {
                var viewportBounds, elementBounds;

                // viewport x,y are in scaled pixels, but w,h is unscaled
                viewportBounds = {
                    left: viewport.scrollLeft,
                    right: viewport.scrollLeft + Math.round(viewport.offsetWidth * self.scaleX()),
                    top: viewport.scrollTop,
                    bottom: viewport.scrollTop + Math.round(viewport.offsetHeight * self.scaleX())
                };

                // element x,y are in unscaled pixels, so scale them
                elementBounds = {
                    left: Math.round(parseInt(recordLabel.offsetLeft) * self.scaleX()),
                    // Using the row index times the row height is cheating, but it works
                    top: Math.round((parseInt(recordLabel.parentNode.offsetHeight) * row) * self.scaleY())
                };

                console.log(viewportBounds)
                console.log(elementBounds)
                console.log(viewportBounds.left / self.scaleX())
                console.log(self.scaleX())


                if (elementBounds.left < (viewportBounds.left / self.scaleX()) ||
                    elementBounds.left > (viewportBounds.right / self.scaleX())) {

                    console.log('derp')
                    viewport.scrollLeft = elementBounds.left;// - (viewport.offsetWidth / 3);

                    if (ruler) // todo: remove when ruler rebuilt
                        ruler.scrollLeft = elementBounds.left;// - (viewport.offsetWidth / 3);
                }

                if (elementBounds.top < viewportBounds.top || elementBounds.top > viewportBounds.bottom) {
                    viewport.scrollTop = elementBounds.top;
                }
            }
        });

        // Moves the viewport X pixels right, and Y pixels down.
        self.pan = function (deltaX, deltaY) {
            var viewport, ruler;

            viewport = document.getElementById('timeline-viewport');
            ruler = document.getElementById('timeline-ruler');

            viewport.scrollTop -= deltaY;
            viewport.scrollLeft -= deltaX;

            if (ruler) // todo: remove when ruler rebuilt
                ruler.scrollLeft -= deltaX;
        };

        // takes a direction in negative or positive integer
        self.scale = function (direction) {
            var scaleFactor, mouseX, mouseY, viewport, ruler;

            viewport = document.querySelector('#timeline-viewport');
            ruler = document.querySelector('#timeline-ruler');

            scaleFactor = direction > 0 ? 1.1 : 1 / 1.1;

            //  mouseX, Y are relative to viewport
            /*
             mouseX = scrollEvent.clientX - viewport.getBoundingClientRect().left;
             mouseY = scrollEvent.clientY - viewport.getBoundingClientRect().top;
             */

            // TODO: actually use mouse location
            // There is a weird behaviour when scrolling in twice, then moving the mouse to a different location,
            // then scrolling back out. It jumps around to about the halfway mark between them, and I can't figure
            // out the math yet. - remiller
            mouseX = viewport.getBoundingClientRect().width / 2;
            mouseY = viewport.getBoundingClientRect().height / 2;

            // TODO: remove the debug point
            var debugPoint = document.getElementById('zoomPoint')
            //debugpoint.style.display='block;'
            debugPoint.style.left = viewport.getBoundingClientRect().left + (mouseX - 2)
            debugPoint.style.top = viewport.getBoundingClientRect().top + (mouseY - 2)

            self.transformOriginX(mouseX / scaleFactor);
            self.transformOriginY(mouseY / scaleFactor);

            self.scaleX(self.scaleX() * scaleFactor);
            self.scaleY(self.scaleY() * scaleFactor);

            viewport.scrollLeft *= scaleFactor;
            viewport.scrollTop *= scaleFactor;

            if (ruler) // todo: remove when ruler rebuilt
                ruler.scrollLeft *= scaleFactor;
        };

        /*
         * recordMouseUp and recordMouseDown are split (ie. not recordClick) to allow drag to abort the event
         * so that it doesn't select when you drag over a record. - remiller
         */
        self.recordMouseUp = function (record) {
            if (self.clickingOnRecord)
                CWRC.selected(record)
        };

        self.recordMouseDown = function (record) {
            self.clickingOnRecord = true
        };

        self.dragStart = function (element, mouseEvent) {
            var x, y;

            if (mouseEvent.touches && mouseEvent.touches.length >= 2) {
                self.pinching = true;
            } else {
                x = mouseEvent.screenX || mouseEvent.touches[0].screenX;
                y = mouseEvent.screenY || mouseEvent.touches[0].screenY;

                self.previousDragPosition = {screenX: x, screenY: y};
            }
        };

        // Note: These are on window rather than the component so that dragging doesn't cut off when the
        // mouse leaves the widget. This is Google Maps behaviour adopted for consistency.
        var dragHandler = function (mouseEvent) {
            var deltaX, deltaY, mouseX, mouseY;

            if (!self.previousDragPosition)
                return;

            // would've used simpler event.movementX and movementY, but Firefox doesn't support yet.
            mouseX = mouseEvent.screenX || mouseEvent.touches[0].screenX;
            mouseY = mouseEvent.screenY || mouseEvent.touches[0].screenY;

            deltaX = mouseX - self.previousDragPosition.screenX;
            deltaY = mouseY - self.previousDragPosition.screenY;

            self.pan(deltaX, deltaY);

            var x = mouseEvent.screenX || mouseEvent.touches[0].screenX;
            var y = mouseEvent.screenY || mouseEvent.touches[0].screenY;
            self.previousDragPosition = {screenX: x, screenY: y};

            self.clickingOnRecord = false;
        };

        var stopDragHandler = function (mouseEvent) {
            self.previousDragPosition = null;
        };

        window.addEventListener('mouseup', stopDragHandler);
        window.addEventListener('touchend', stopDragHandler);

        window.addEventListener('mousemove', dragHandler);
        window.addEventListener('touchmove', function (touchEvent) {
            if (touchEvent.touches.length > 1) {
                alert('Zoom not yet supported on touch.');
                //self.scale(something)
            } else {
                dragHandler(touchEvent);
            }
        });
    }
});
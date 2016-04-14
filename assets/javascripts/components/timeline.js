ko.components.register('timeline', {
    template: {element: 'timeline-template'},

    /**
     * A timeline with markers at each time point in the data set.
     *
     * Records with multiple locations have all markers "linked", so that selecting one will highlight all.
     *
     * For developers:
     * The coordianate systems can get confusing sometimes. Remember that each measurement is either going to be in
     * true pixels or scaled pixels. Please leave comments to make it clear what unit a distance is in.
     */
    viewModel: function (params) {
        var self = this;

        self.previousDragPosition = null;

        self.pixelsPerMs = 1 / CWRC.toMillisec('day');
        self.labelSize = CWRC.toMillisec('year') * self.pixelsPerMs; // px
        self.tokens = [];

        self.scale = ko.observable(1.0);

        self.rulerTransform = ko.computed(function () {
            return 'scaleX(' + self.scale() + ')';
        });

        self.zoomTransform = ko.computed(function () {
            return 'scale(' + self.scale() + ',' + self.scale() + ')';
        });

        // full filtered records, sorted by start
        self.records = ko.pureComputed(function () {
            var records, timeDiff;

            // fetch only the data that have non-null start dates, sort by start date.
            records = CWRC.select(CWRC.filteredData(), function (item) {
                return item.startDate;
            }).sort(function (a, b) {
                timeDiff = CWRC.toStamp(a) - CWRC.toStamp(b);

                if (timeDiff == 0)
                    return a.label.localeCompare(b.label);
                else
                    return timeDiff;
            });

            return records;
        });

        self.earliestDate = ko.pureComputed(function () {
            var firstRecord = self.records()[0];

            return firstRecord ? new Date(firstRecord.startDate) : new Date();
        });

        self.latestDate = ko.pureComputed(function () {
            var sortedRecords = self.records();
            var lastRecord = sortedRecords[sortedRecords.size];

            return lastRecord ? new Date(lastRecord.endDate || lastRecord.startDate) : new Date();
        });

        self.years = ko.pureComputed(function () {
            return ko.utils.range(self.earliestDate().getUTCFullYear(), self.latestDate().getUTCFullYear());
        });

        self['toPixels'] = function (stamp) {
            return stamp * self.pixelsPerMs;
        };

        self['originStamp'] = function () {
            return CWRC.toStamp(self.years()[0].toString());
        };

        self.canvasHeight = ko.observable();

        self.canvasWidth = ko.pureComputed(function () {
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

        self.timelineTokens = ko.computed(function () {
            var startStamp, endStamp, duration, tokens, unplacedRecords, cutoff, rowIndex, toMilliSecs, toPixels, nextRecordIndex;

            unplacedRecords = self.records().slice(); // slice to duplicate array, otherwise we would alter the cached value
            tokens = [];
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

            while (unplacedRecords.length > 0) {
                var record, recordIndex, isPastCutoff;

                isPastCutoff = cutoff > CWRC.toStamp(unplacedRecords[unplacedRecords.length - 1]);

                if (typeof cutoff === 'undefined' || isPastCutoff) {
                    cutoff = CWRC.toStamp(unplacedRecords[0]);
                    rowIndex++;
                }

                recordIndex = nextRecordIndex(cutoff, unplacedRecords);

                record = unplacedRecords.splice(recordIndex, 1)[0];

                startStamp = CWRC.toStamp(record.startDate);
                endStamp = CWRC.toStamp(record.endDate) || startStamp;

                // duration can be artificially set to label size to ensure there's enough room for a label
                duration = Math.max(Math.abs(endStamp - startStamp), toMilliSecs(self.labelSize));

                tokens.push(new CWRC.Timeline.Token({
                    xPos: toPixels(startStamp - self.originStamp()),
                    row: rowIndex,
                    width: toPixels(duration),
                    data: record
                }));

                cutoff = startStamp + duration;
            }

            self.canvasHeight((rowIndex + 10) * CWRC.Timeline.LABEL_HEIGHT);

            return tokens;
        });

        self.labelPosition = function (year) {
            return self.toPixels(CWRC.toStamp(year.toString()) - self.originStamp())
        };

        self.unplottableCount = ko.pureComputed(function () {
            // can't use self.records here, because records is filtered.
            return CWRC.rawData().length - CWRC.select(CWRC.rawData(), function (item) {
                    return item.startDate;
                }).length;
        });

        self.viewport = function () {
            return document.getElementById('timeline-viewport');
        };
        self.ruler = function () {
            return document.getElementById('timeline-ruler');
        };

        // Store state separate from viewport so that it only rounds once at the end, not every step. This eliminates drift
        // Top, left, right, and bottom are in scaled pixels
        self.viewportBounds = {
            left: ko.observable(0),
            top: ko.observable(0),
            right: function () {
                return self.viewportBounds.left() + (self.viewport().offsetWidth * self.scale());
            },
            bottom: function () {
                return self.viewportBounds.top() + (self.viewport().offsetHeight * self.scale());
            }
        };

        // Wrapped in a timeout to run after the actual canvas is initialized.
        // TODO: this is a hack, but there isn't currently any event to hook into for when the timeline is done loading
        setTimeout(function () {
            var startFocusStamp = CWRC.toStamp(params['startDate']) || 0;
            var startOffset = startFocusStamp - self.originStamp();

            self.pan(self.toPixels(-startOffset), 0)
        }, 100);

        CWRC.selected.subscribe(function (selectedRecord) {
            var viewport, recordLabel, row, col, rows, records, ruler;

            rows = self.timelineTokens();

            // this is awful, but is so far the only way to find the event label.
            // applying an ID is arbitrary *and* fragile, and no other unique data exists.
            // So we just rely on he expected correlation of their location because this class
            // is also doing the layout. - retm
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

            if (recordLabel) {
                var elementBounds;

                // element x,y are in unscaled pixels, so scale them
                elementBounds = {
                    left: Math.round(parseInt(recordLabel.offsetLeft) * self.scale()),
                    // Using the row index times the row height is cheating, but it works
                    top: Math.round((parseInt(recordLabel.parentNode.offsetHeight) * row) * self.scale())
                };

                if (elementBounds.left < self.viewportBounds.left() ||
                    elementBounds.left > self.viewportBounds.right()) {

                    self.viewportBounds.left(elementBounds.left);

                    if (ruler) // todo: remove when ruler rebuilt
                        ruler.scrollLeft = elementBounds.left;
                }

                if (elementBounds.top < self.viewportBounds.top || elementBounds.top > self.viewportBounds.bottom) {
                    self.viewportBounds.top(elementBounds.top);
                }
            }
        });

        self.viewportBounds.left.subscribe(function (newVal) {
            self.viewport().scrollLeft = Math.round(newVal);
        });

        self.viewportBounds.top.subscribe(function (newVal) {
            self.viewport().scrollTop = Math.round(newVal);
        });

        // Moves the viewport X pixels right, and Y pixels down. Both x, y are in unscaled pixels
        self.pan = function (deltaX, deltaY) {
            var newLeft, newTop, maxLeft, maxTop, canvas;

            canvas = document.querySelector('#timeline-viewport .canvas');

            maxLeft = canvas.offsetWidth * self.scale() - self.viewport().offsetWidth;
            maxTop = canvas.offsetHeight * self.scale() - self.viewport().offsetHeight;

            newLeft = Math.max(0, Math.min(self.viewportBounds.left() - deltaX, maxLeft));
            newTop = Math.max(0, Math.min(self.viewportBounds.top() - deltaY, maxTop));

            self.viewportBounds.left(newLeft);
            self.viewportBounds.top(newTop);

            if (self.ruler) // todo: remove when ruler rebuilt
                self.ruler.scrollLeft -= deltaX;
        };

        /**
         *
         * @param viewFocusX In raw pixels, relative to viewport
         * @param viewFocusY In raw pixels, relative to viewport
         * @param zoomIn Boolean: true zoom in, false zoom out
         */
        self.zoom = function (viewFocusX, viewFocusY, zoomIn) {
            var stepScaleFactor, oldScale;

            stepScaleFactor = zoomIn ? (1.1) : (1 / 1.1);

            /*
             * We know that the zoom focus point, relative to the canvas (Xfc) can be described by this formula:
             * [units in square brackets]
             *
             *              Xvc [px] + Xfv [px]
             * Xfc [can] =  ------------------
             *                S [px/can]              # Divide by scale, because we're scaling the canvas, not the viewport.
             *
             * We also know that the after-scale, the focus point equals this:
             *
             *               X'vc [px] + X'fv [px]
             * X'fc [can] =   ------------------
             *                 S' [px/can]
             *
             * We also know that X'fv [px] = Xfv [px], because they are both the focus point, relative to the viewport
             * in raw px, and so does not change. Further, we know that  X'fc [can] = Xfc [can], as they're both
             * referring to the exact same logical location relative to the canvas and in canvas units.
             *
             * Sub in eqivalencies, and rearrange to solve for the new view offset, relative to canvas, in px (X'vc):
             *
             *       X'vc [px] = ( Xvc [px] + Xvf [px] ) * (S' [px/can] / S [px/can]) - Xfv [px]
             *
             *
             * - retm
             */
            oldScale = self.scale();

            self.scale(self.scale() * stepScaleFactor);

            self.viewportBounds.left(( self.viewportBounds.left() + viewFocusX ) * (self.scale() / oldScale) - viewFocusX);
            self.viewportBounds.top(( self.viewportBounds.top() + viewFocusY ) * (self.scale() / oldScale) - viewFocusY);

            if (self.ruler) // todo: remove when ruler rebuilt
                self.ruler.scrollLeft *= stepScaleFactor;
        };

        self.scrollHandler = function (viewModel, scrollEvent) {
            var mouseX, mouseY;

            //  mouseX, Y are relative to viewport, in unscaled pixels
            mouseX = scrollEvent.clientX - self.viewport().getBoundingClientRect().left;
            mouseY = scrollEvent.clientY - self.viewport().getBoundingClientRect().top;

            self.zoom(mouseX, mouseY, scrollEvent.deltaY < 0);

            return false; // prevent regular page scrolling.
        };

        /*
         * recordMouseUp and recordMouseDown are split (ie. not recordClick) to allow drag to abort the event
         * so that it doesn't select when you drag over a record. - retm
         */
        self.recordMouseUp = function (token) {
            if (self.clickingOnRecord)
                CWRC.selected(token.data)
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
                //self.zoom(something)
            } else {
                dragHandler(touchEvent);
            }
        });
    }
});

CWRC.Timeline = CWRC.Timeline || {};

CWRC.Timeline.LABEL_HEIGHT = 1.5; //em
CWRC.Timeline.SELECTED_LAYER = 10;

CWRC.Timeline.Token = function (params) {
    var self = this;

    this.xPos = params.xPos;
    this.width = params.width;
    this.height = (params.row + 2) * CWRC.Timeline.LABEL_HEIGHT + 'em';

    this.data = params.data;

    this.isSelected = ko.pureComputed(function () {
        return self.data == CWRC.selected();
    });

    this.layer = function () {
        return this.isSelected() ? CWRC.Timeline.SELECTED_LAYER : -params.row;
    };
};
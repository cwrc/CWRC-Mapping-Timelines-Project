ko.components.register('timeline', {
    template: {element: 'timeline-template'},

    /**
     * A timeline with markers at each time point in the data set.
     *
     * Records with multiple locations have all markers "linked", so that selecting one will highlight all.
     *
     * @param startDate: The initial date to focus on.
     * @param zoomStep: Decimal number if the zooming factor to apply at at zoom step. eg. 1.5 will zoom in by 50% each step.
     *
     * *** For developers ***
     * This widget is split into multiple parts, each with these responsibilities
     * 1. The base viewModel - handles raw input and coordinates it between the other parts
     * 2. Token    - Data model for an individual event
     * 3. Canvas   - Conceptually the full dataset
     * 4. Viewport - Pannable, zoomable visiable area over the canvas
     * 5. Ruler    - The scale for the widget
     */
    viewModel: function (params) {
        var self = this;

        self.previousDragPosition = null;

        self.unplottableCount = ko.pureComputed(function () {
            // can't use self.records here, because records is filtered.
            return CWRC.rawData().length - CWRC.rawData().filter(function (item) {
                    return item.getStartDate();
                }).length;
        });

        // full filtered records, sorted by start
        self.records = ko.pureComputed(function () {
            var records, timeDiff;

            // fetch only the data that have non-null start dates, sort by start date.
            records = CWRC.filteredData().filter(function (item) {
                return item.getStartDate();
            }).sort(function (a, b) {
                timeDiff = a.getStartStamp() - b.getStartStamp();

                if (timeDiff == 0)
                    return a.getLabel().localeCompare(b.getLabel());
                else
                    return timeDiff;
            });

            return records;
        });

        self.canvas = new CWRC.Timeline.Canvas(self.records);

        // TODO: merge into class
        self.canvas.allTokens = ko.computed(function () {
            var tokens, token, unplacedRecords, cutoff, rowIndex;

            unplacedRecords = self.records().filter(function () {
                return true;
            }); // slice to duplicate array, otherwise we would alter the cached value
            tokens = [];
            rowIndex = -1;

            while (unplacedRecords.length > 0) {
                var record, recordIndex, isPastCutoff;

                isPastCutoff = cutoff > unplacedRecords[unplacedRecords.length - 1].getStartStamp();

                if (typeof cutoff === 'undefined' || isPastCutoff) {
                    cutoff = unplacedRecords[0].getStartStamp();
                    rowIndex++;
                }

                // this 'extra' function layer is to avoid touching a mutable var in a closure, which is apparently bad.
                recordIndex = function (cutoff) {
                    return unplacedRecords.findIndex(function (record) {
                        return record.getStartStamp() >= cutoff;
                    })
                }(cutoff);

                record = unplacedRecords.splice(recordIndex, 1)[0];

                token = new CWRC.Timeline.Token(self.canvas, record, rowIndex);

                tokens.push(token);

                // duration is artificially inflated in case of points to make room for a label.
                cutoff = token.startStamp() + (token.duration() || CWRC.toMillisec('year') / 2);
            }

            self.canvas.rowCount(rowIndex + 10);

            return tokens;
        });

        self.viewport = new CWRC.Timeline.Viewport(self.canvas, params['startDate'], params['zoomStep'] || CWRC.Timeline.DEFAULT_SCALE_STEP);
        self.ruler = new CWRC.Timeline.Ruler(self.viewport);

        // TODO: move this somewhere?
        self.viewport.timelineTokens = ko.pureComputed(function () {
            return self.canvas.allTokens().filter(function (token) {
                var startStamp = token.data.getStartStamp();
                var endStamp = token.data.getEndStamp() || (startStamp + CWRC.toMillisec('year'));

                return endStamp >= self.viewport.bounds.leftStamp() &&
                    startStamp <= self.viewport.bounds.rightStamp();
            })
        });

        CWRC.selected.subscribe(function (selectedRecord) {
            var token, recordStamp;

            recordStamp = selectedRecord.getStartStamp();

            token = self.canvas.timelineTokens().find(function (token) {
                return token.data == selectedRecord;
            });

            if (!self.viewport.bounds.contains(recordStamp, token.row))
                self.viewport.panTo(recordStamp, token.row);
        });

        self.scrollHandler = function (viewModel, scrollEvent) {
            var mouseX, mouseY, viewportRect;

            viewportRect = self.viewport.getElement().getBoundingClientRect();

            //  mouseX, Y are relative to viewport, in unscaled pixels
            mouseX = scrollEvent.clientX - viewportRect.left;
            mouseY = scrollEvent.clientY - viewportRect.top;

            self.viewport.zoom(mouseX, mouseY, scrollEvent.deltaY < 0);

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

            if (mouseEvent.buttons != 1)
                return;

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
        self.dragHandler = function (mouseEvent) {
            var deltaX, deltaY, mouseX, mouseY;

            if (!self.previousDragPosition)
                return;

            // would've used simpler event.movementX and movementY, but Firefox doesn't support yet.

            if (mouseEvent.touches && mouseEvent.touches.length > 0) {
                mouseX = mouseEvent.touches[0].screenX;
                mouseY = mouseEvent.touches[0].screenY;
            } else {
                mouseX = mouseEvent.screenX;
                mouseY = mouseEvent.screenY;
            }

            deltaX = mouseX - self.previousDragPosition.screenX;
            deltaY = mouseY - self.previousDragPosition.screenY;

            self.viewport.panPixels(deltaX, deltaY);

            self.previousDragPosition = {screenX: mouseX, screenY: mouseY};

            self.clickingOnRecord = false;
        };

        self.stopDragHandler = function (mouseEvent) {
            self.previousDragPosition = null;
        };

        window.addEventListener('mouseup', self.stopDragHandler);
        window.addEventListener('touchend', self.stopDragHandler);

        window.addEventListener('mousemove', self.dragHandler);
        window.addEventListener('touchmove', function (touchEvent) {
            if (touchEvent.touches.length > 1) {
                alert('Zoom not yet supported on touch.');
                //self.zoom(something)
            } else {
                self.dragHandler(touchEvent);
            }
        });
    }
});

CWRC.Timeline = CWRC.Timeline || {};

CWRC.Timeline.DEFAULT_SCALE_STEP = 1.25;
CWRC.Timeline.LABEL_HEIGHT = 24;//px   //or 1.5; //em

CWRC.Timeline.__tokenId__ = 1;

(function Token() {
    CWRC.Timeline.Token = function (canvas, record, row) {
        var self = this;

        this.id = CWRC.Timeline.__tokenId__++;

        this.data = record;

        this.row = row;

        this.xPos = canvas.stampToPixels(this.startStamp() - canvas.earliestStamp());
        this.width = (canvas.stampToPixels(this.duration()) || '') + 'px';
        this.height = (this.row + 1) * CWRC.Timeline.LABEL_HEIGHT + 'px';

        this.isHovered = ko.observable(false);
        this.isSelected = ko.pureComputed(function () {
            return self.data == CWRC.selected();
        });
    };

    CWRC.Timeline.Token.prototype.duration = function () {
        return Math.abs(this.endStamp() - this.startStamp());
    };

    CWRC.Timeline.Token.prototype.startStamp = function () {
        return this.data.getStartStamp();
    };

    CWRC.Timeline.Token.prototype.endStamp = function () {
        return this.data.getEndStamp() || this.data.getStartStamp();
    };

    CWRC.Timeline.Token.prototype.layer = function () {
        return this.isSelected() || this.isHovered() ? null : -this.row;
    };
})();

(function Ruler() {
    CWRC.Timeline.Ruler = function (viewport) {
        var self = this;

        this.viewport = viewport;

        // can we make these simpler by removing the words?
        this.minorUnit = ko.pureComputed(function () {
            var msSpan = (self.getElement().offsetWidth / viewport.canvas.pixelsPerMs());

            if (msSpan < CWRC.toMillisec('minute'))
                return 'seconds';
            else if (msSpan < CWRC.toMillisec('hour'))
                return 'minutes';
            else if (msSpan < CWRC.toMillisec('day'))
                return 'hours';
            else if (msSpan < CWRC.toMillisec('month'))
                return 'days';
            else if (msSpan < CWRC.toMillisec('year'))
                return 'months';
            else if (msSpan < CWRC.toMillisec('decade'))
                return 'years';
            else if (msSpan < CWRC.toMillisec('century'))
                return 'decades';
            else if (msSpan < CWRC.toMillisec('year') * 1000)
                return 'centuries';
            else
                return 'millennia';
        });

        this.majorUnit = ko.pureComputed(function () {
            var msSpan = (self.getElement().offsetWidth / viewport.canvas.pixelsPerMs());

            if (msSpan < CWRC.toMillisec('minute'))
                return 'minutes';
            else if (msSpan < CWRC.toMillisec('hour'))
                return 'hours';
            else if (msSpan < CWRC.toMillisec('day'))
                return 'days';
            else if (msSpan < CWRC.toMillisec('month'))
                return 'months';
            else if (msSpan < CWRC.toMillisec('year'))
                return 'years';
            else if (msSpan < CWRC.toMillisec('decade'))
                return 'decades';
            else if (msSpan < CWRC.toMillisec('century'))
                return 'centuries';
            else
                return 'millennia';
        });
    };

    CWRC.Timeline.Ruler.prototype.step = function (unit) {
        var spanDate, dates, label, viewportBounds;

        dates = [];
        viewportBounds = this.viewport.bounds;
        spanDate = new Date(viewportBounds.leftStamp());

        this.floorDate(spanDate, unit);

        while (spanDate.getTime() <= viewportBounds.rightStamp()) {
            if (/days?/i.test(unit))
                label = spanDate.getDate();
            else if (/months?/i.test(unit))
            // toLocalString options aren't supported in IE 9 & 10.
                label = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][spanDate.getMonth()];
            else if (/decades?|centuries|century|millenium|millenia/i.test(unit))
                label = spanDate.getFullYear() + 's';
            else
                label = spanDate.getFullYear();

            dates.push({
                label: label,
                position: (spanDate.getTime() - viewportBounds.leftStamp()) * this.viewport.canvas.pixelsPerMs() + 'px'
            });

            this.advance(spanDate, unit);
        }

        return dates;
    };

    CWRC.Timeline.Ruler.prototype.getElement = function () {
        return document.getElementById('timeline-ruler');
    };

    CWRC.Timeline.Ruler.prototype.advance = function (date, unit, amount) {
        amount = amount || 1;

        if (/days?/i.test(unit))
            date.setDate(date.getDate() + amount);
        else if (/months/i.test(unit))
            date.setMonth(date.getMonth() + amount);
        else if (/years/i.test(unit))
            date.setFullYear(date.getFullYear() + amount);
        else if (/decades/i.test(unit))
            date.setFullYear(date.getFullYear() + amount * 10);
        else if (/centuries/i.test(unit))
            date.setFullYear(date.getFullYear() + amount * 100);
        else
            date.setFullYear(date.getFullYear() + amount * 1000);
    };

    CWRC.Timeline.Ruler.prototype.floorDate = function (date, unit) {
        var granularity, yearsBy;

        if (/months?/i.test(unit))
            date.setMonth(date.getMonth(), 1);
        else if (!/days?/i.test(unit)) {
            yearsBy = function (granularity, source) {
                return Math.floor(source.getFullYear() / granularity) * granularity
            };

            if (/years/i.test(unit))
                granularity = 1;
            else if (/decades/i.test(unit))
                granularity = 10;
            else if (/centuries/i.test(unit))
                granularity = 100;
            else
                granularity = 1000;

            date.setFullYear(yearsBy(granularity, date), 0, 1);
        }

        // assumes that the minimum unit is day, so we can ignore everything lower.
        date.setHours(0, 0, 0);

        return date;
    }
})();


(function Canvas() {
    CWRC.Timeline.Canvas = function (recordsObservable) {
        var self = this;

        this.pixelsPerMs = ko.observable(1 / CWRC.toMillisec('day'));
        this.rowHeight = ko.observable(CWRC.Timeline.LABEL_HEIGHT);
        this.rowCount = ko.observable();

        //this.zoomTransform = ko.pureComputed(function () {
        //    var scale = 1.0;
        //
        //    return 'scale(' + scale + ',' + scale + ')';
        //});

        this.bounds = {
            height: ko.pureComputed(function () {
                return self.rowCount() * self.rowHeight() + 'em';
            }),
            width: ko.pureComputed(function () {
                var timespan, startStamp, endStamp;

                startStamp = self.earliestStamp();
                endStamp = self.latestStamp();

                if (startStamp == endStamp) {
                    return '100%';
                } else {
                    timespan = (endStamp - startStamp); // in ms

                    return self.stampToPixels(timespan) + self.stampToPixels(CWRC.toMillisec('year')) + 'px';
                }
            })
        };

        this.earliestStamp = ko.pureComputed(function () {
            var firstRecord = recordsObservable()[0];

            return firstRecord ? firstRecord.getStartStamp() : (new Date()).getTime();
        });

        this.latestStamp = ko.pureComputed(function () {
            var records, lastRecord;

            records = recordsObservable();
            lastRecord = records[records.length - 1];

            return lastRecord ? (lastRecord.getEndStamp() || lastRecord.getStartStamp()) : (new Date()).getTime();
        });

        this.earliestDate = ko.pureComputed(function () {
            return new Date(self.earliestStamp());
        });

        this.latestDate = ko.pureComputed(function () {
            return new Date(self.latestStamp());
        });

    };

    CWRC.Timeline.Canvas.prototype.getElement = function () {
        return document.querySelector('#timeline-viewport .canvas');
    };

    CWRC.Timeline.Canvas.prototype.stampToPixels = function (stamp) {
        return stamp * this.pixelsPerMs();
    };

    CWRC.Timeline.Canvas.prototype.pixelsToStamp = function (px) {
        return px / this.pixelsPerMs();
    };

    CWRC.Timeline.Canvas.prototype.rowToPixels = function (row) {
        return row * this.rowHeight();
    };

    CWRC.Timeline.Canvas.prototype.pixelsToRow = function (px) {
        return px / this.rowHeight();
    }
})();

(function Viewport() {
    CWRC.Timeline.Viewport = function (canvas, startDate, scaleStep) {
        var self = this;

        this.canvas = canvas;

        this.scaleStep = scaleStep;

        // Bounds are stored as time stamps on X axis, number of rows as Y axis. Both are doubles to be
        // rounded only once when converted to pixels
        this.bounds = {
            leftStamp: ko.observable(self.canvas.earliestStamp()),
            topRow: ko.observable(0),
            rightStamp: ko.pureComputed(function () {
                return self.bounds.leftStamp() +
                    self.canvas.pixelsToStamp(self.getElement().offsetWidth);
            }),
            bottomRow: ko.pureComputed(function () {
                return self.bounds.topRow() +
                    self.canvas.pixelsToRow(self.getElement().offsetHeight);
            }),
            timespan: function () {
                return this.rightStamp() - this.leftStamp();
            },
            visibleRows: function () {
                return this.bottomRow() - this.topRow();
            },
            contains: function (stamp, row) {
                return (stamp >= self.bounds.leftStamp() && stamp <= self.bounds.rightStamp()) &&
                    (row >= self.bounds.topRow() && row <= self.bounds.bottomRow())
            }
        };

        this.bounds.leftStamp.subscribe(function (newVal) {
            var stampDistance = newVal - self.canvas.earliestStamp();

            self.getElement().scrollLeft = Math.round(self.canvas.stampToPixels(stampDistance));
        });

        this.bounds.topRow.subscribe(function (newVal) {
            self.getElement().scrollTop = Math.round(self.canvas.rowToPixels(newVal));
        });


        // TODO: this timeout is a hack, but there isn't currently any event to hook into for when the timeline is done loading
        // TODO: it could be removed if the canvas wasn't panned to via scrolling.
        // Wrapped in a timeout to run after the actual canvas is initialized.
        setTimeout(function () {
            if (startDate)
                self.panTo((new Date(startDate)).getTime(), 0)
        }, 100);
    };

    CWRC.Timeline.Viewport.prototype.getElement = function () {
        return document.getElementById('timeline-viewport');
    };

    /**
     *
     * @param viewFocusX In raw pixels, relative to viewport
     * @param viewFocusY In raw pixels, relative to viewport
     * @param zoomIn Boolean: true zoom in, false zoom out
     */
    CWRC.Timeline.Viewport.prototype.zoom = function (viewFocusX, viewFocusY, zoomIn) {
        var scaleFactor, beforeZoomFocusStamp, afterZoomFocusStamp, canvas;

        canvas = this.canvas;

        scaleFactor = zoomIn ? (this.scaleStep) : (1 / this.scaleStep);

        beforeZoomFocusStamp = this.bounds.leftStamp() + canvas.pixelsToStamp(viewFocusX);

        canvas.pixelsPerMs(canvas.pixelsPerMs() * scaleFactor);

        afterZoomFocusStamp = this.bounds.leftStamp() + canvas.pixelsToStamp(viewFocusX);

        // readjusting to keep the mouse-hovered point consistent is better for UX and behaviourally matches the map
        this.bounds.leftStamp(this.bounds.leftStamp() - (afterZoomFocusStamp - beforeZoomFocusStamp));
    };

    CWRC.Timeline.Viewport.prototype.panTo = function (stamp, row) {
        var viewportBounds;

        viewportBounds = this.bounds; // todo: remove this once in class

        viewportBounds.leftStamp(stamp - (viewportBounds.timespan() / 2));
        viewportBounds.topRow(row - (viewportBounds.visibleRows() / 2) + 0.5); // 0.5 b/c labels are offset by a half row
    };

    // Moves the viewport X pixels right, and Y pixels down.
    CWRC.Timeline.Viewport.prototype.panPixels = function (deltaX, deltaY) {
        var newStamp, newRow;

        newStamp = this.bounds.leftStamp() - this.canvas.pixelsToStamp(deltaX);
        newRow = this.bounds.topRow() - this.canvas.pixelsToRow(deltaY);

        // TODO: either remove these limits and use a transform, or make these limits an extender on the obervable
        // limit panning to ~ the canvas size
        newStamp = Math.max(newStamp, this.canvas.earliestStamp());
        newStamp = Math.min(newStamp, this.canvas.latestStamp() + CWRC.toMillisec('year') - this.bounds.timespan());

        newRow = Math.max(newRow, 0);
        newRow = Math.min(newRow, this.canvas.rowCount() - this.bounds.visibleRows());

        this.bounds.leftStamp(newStamp);
        this.bounds.topRow(newRow);
    }

})();

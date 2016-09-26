ko.components.register('timeline', {
    template: {element: 'timeline-template'},

    /**
     * A timeline with markers at each time point in the data set.
     *
     * Any records with multiple locations have all markers "linked", so that selecting one will highlight all.
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

        self.unplottableCount = ko.pureComputed(function () {
            // can't use canvas records here, because that's filtered.
            return CWRC.rawData().length - CWRC.rawData().filter(function (item) {
                    return item.getStartDate();
                }).length;
        });

        self.canvas = new CWRC.Timeline.Canvas();

        self.viewport = new CWRC.Timeline.Viewport(self.canvas, params['startDate'], params['zoom'], params['zoomStep']);
        self.ruler = new CWRC.Timeline.Ruler(self.viewport);

        CWRC.selected.subscribe(function (selectedRecord) {
            var token, recordStamp;

            recordStamp = selectedRecord.getStartStamp();

            token = self.canvas.tokens().find(function (token) {
                return token.data == selectedRecord;
            });

            if (token && !self.viewport.bounds.contains(recordStamp, token.row()))
                self.viewport.panTo(recordStamp, token.row());
        });

        self.mouseHandler = {
            previousDragPosition: null,
            onDragStart: function (element, mouseEvent) {
                var x, y;

                if (mouseEvent.buttons != 1)
                    return;

                x = mouseEvent.screenX || mouseEvent.touches[0].screenX;
                y = mouseEvent.screenY || mouseEvent.touches[0].screenY;

                self.mouseHandler.previousDragPosition = {screenX: x, screenY: y};
            },
            onMove: function (mouseEvent) {
                var deltaX, deltaY, mouseX, mouseY, previousDragPosition;

                previousDragPosition = self.mouseHandler.previousDragPosition;

                if (!previousDragPosition)
                    return;

                mouseX = mouseEvent.screenX;
                mouseY = mouseEvent.screenY;

                deltaX = mouseX - previousDragPosition.screenX;
                deltaY = mouseY - previousDragPosition.screenY;

                self.viewport.panPixels(deltaX, deltaY);

                self.mouseHandler.previousDragPosition = {screenX: mouseX, screenY: mouseY};

                self.clickingOnRecord = false;
            },
            onDragEnd: function (mouseEvent) {
                self.mouseHandler.previousDragPosition = null;
            },
            /*
             * recordMouseUp and recordMouseDown are split (ie. not recordClick) to allow drag to abort the event
             * so that it doesn't select when you drag over a record. - retm
             */
            recordMouseUp: function (token) {
                if (self.clickingOnRecord)
                    CWRC.selected(token.data)
            },
            recordMouseDown: function (record) {
                self.clickingOnRecord = true; // this gets reset if the click turns into a drag
            },
            onScroll: function (viewModel, scrollEvent) {
                var mouseX, mouseY, viewportRect;

                scrollEvent = scrollEvent.originalEvent || scrollEvent; // jquery wraps the event and ruins the API

                viewportRect = self.viewport.getElement().getBoundingClientRect();

                //  mouseX, Y are relative to viewport, in unscaled pixels
                mouseX = scrollEvent.clientX - viewportRect.left;
                mouseY = scrollEvent.clientY - viewportRect.top;

                self.viewport.zoom(mouseX, mouseY, scrollEvent.deltaY < 0);

                return false; // prevent regular page scrolling.
            }
        };

        self.touchHandler = {
            touchCache: ko.observableArray(),
            onTouch: function (element, touchEvent) {
                //for (var i = 0; i < touchEvent.targetTouches.length; i++) {
                //    var touch = touchEvent.targetTouches[i];
                //
                //    self.touchHandler.touchCache.push(touch);
                //}

                self.touchHandler.touchCache(touchEvent.targetTouches)
            },
            onMove: function (touchEvent) {
                var cache;

                if (touchEvent.touches.length != self.touchHandler.touchCache().length)
                    return; // nope!

                cache = self.touchHandler.touchCache();

                if (cache.length == 1) {
                    var deltaX, deltaY, touchX, touchY;

                    touchX = touchEvent.changedTouches[0].screenX;
                    touchY = touchEvent.changedTouches[0].screenY;

                    deltaX = touchX - cache[0].screenX;
                    deltaY = touchY - cache[0].screenY;

                    self.viewport.panPixels(deltaX, deltaY);

                    self.touchHandler.touchCache([touchEvent.changedTouches[0]])
                } else {
                    var currentTouch1, currentTouch2, previousTouch1, previousTouch2, midpointX, midpointY, previousDistance, currentDistance;

                    currentTouch1 = {
                        x: touchEvent.touches[0].screenX,
                        y: touchEvent.touches[0].screenY
                    };
                    currentTouch2 = {
                        x: touchEvent.touches[1].screenX,
                        y: touchEvent.touches[1].screenY
                    };

                    previousTouch1 = {
                        x: self.touchHandler.touchCache()[0].screenX,
                        y: self.touchHandler.touchCache()[0].screenY
                    };
                    previousTouch2 = {
                        x: self.touchHandler.touchCache()[1].screenX,
                        y: self.touchHandler.touchCache()[1].screenY
                    };

                    // I can't believe that JS makes this this hard to read.
                    previousDistance = Math.sqrt(
                        Math.pow(previousTouch1.x - previousTouch2.x, 2)
                        +
                        Math.pow(previousTouch1.y - previousTouch2.y, 2)
                    );
                    currentDistance = Math.sqrt(
                        Math.pow(currentTouch1.x - currentTouch2.x, 2)
                        +
                        Math.pow(currentTouch1.y - currentTouch2.y, 2)
                    );

                    midpointX = Math.abs(currentTouch1.x - currentTouch2.x) / 2;
                    midpointY = Math.abs(currentTouch1.y - currentTouch2.y) / 2;

                    self.viewport.zoom(midpointX, midpointY, previousDistance < currentDistance);

                    return false; // prevent regular page-wide zoom
                }
            },
            onUntouch: function (touchEvent) {
                self.touchHandler.touchCache([]);
            }
        };

        /* Note: Most drag events are on window rather than the component so that dragging doesn't
         * cut off when the mouse leaves the widget.
         *
         * This is Google Maps behaviour adopted for consistency and better UX.
         */
        window.addEventListener('mousemove', self.mouseHandler.onMove);
        window.addEventListener('mouseup', self.mouseHandler.onDragEnd);

        window.addEventListener('touchmove', self.touchHandler.onMove);
        window.addEventListener('touchend', self.touchHandler.onUntouch);
    }
});

CWRC.Timeline = CWRC.Timeline || {};

CWRC.Timeline.DEFAULT_SCALE_STEP = 1.25;

(function Token() {
    CWRC.Timeline.__tokenId__ = 1;

    CWRC.Timeline.LABEL_HEIGHT = 24;//px   //or 1.5; //em

    CWRC.Timeline.DEFAULT_LABEL_DURATION = CWRC.toMillisec('year') / 2;

    CWRC.Timeline.Token = function (record, canvas) {
        var self = this;

        self.id = CWRC.Timeline.__tokenId__++;

        self.data = record;
        self.canvas = canvas;

        self.xPos = ko.pureComputed(function () {
            return self.canvas.stampToPixels(self.startStamp() - CWRC.earliestStamp());
        });

        self.markerTransform = ko.pureComputed(function () {
            return 'translateX(' + self.canvas.stampToPixels(self.startStamp() - CWRC.earliestStamp()) + 'px)';
        });

        self.lineWidth = ko.pureComputed(function () {
            return self.duration() ? self.canvas.stampToPixels(self.duration()) : '';
        });
        self.labelWidth = ko.pureComputed(function () {
            if (self.duration() > CWRC.Timeline.DEFAULT_LABEL_DURATION)
                return self.lineWidth();
            else
                return self.canvas.stampToPixels(CWRC.Timeline.DEFAULT_LABEL_DURATION);
        });
        self.maxLabelWidth = ko.pureComputed(function () {
            return self.canvas.stampToPixels(Math.max(self.duration(), CWRC.Timeline.DEFAULT_LABEL_DURATION));
        });

        self.row = ko.observable(0);
        //self.row = ko.computed(function () {
        //    return self.__calculateNewRow()
        //});
        // .extend({rateLimit: {timeout: 500, method: "notifyWhenChangesStop"}});

        self.height = ko.pureComputed(function () {
            return (self.row() + 1) * CWRC.Timeline.LABEL_HEIGHT;
        });

        //self.potentialIntersectors = ko.pureComputed(function () {
        //    self.canvas.tokens().filter(function (otherToken) {
        //        return self.sharesHorizontal(otherToken) &&
        //            self.row() == otherToken.row()
        //            && self != otherToken;
        //    });
        //});

        self.isHovered = ko.observable(false);
        self.isSelected = ko.pureComputed(function () {
            return self.data == CWRC.selected();
        });

        self.visible = ko.pureComputed(function () {
            return CWRC.filteredData().indexOf(self.data) >= 0;
        });
    };

    CWRC.Timeline.Token.prototype.updateRow = function () {
        this.row(this.__calculateNewRow());
    };

    CWRC.Timeline.Token.prototype.__calculateNewRow = function () {
        var self = this;
        var intersectors, durationDiff, startDiff;

        if (!self.canvas.tokens || !self.canvas.tokens())
            return 10;

        // intersectors array will always at least include 'this'
        intersectors =

            // sort to get consistent row order
            intersectors.sort(function (a, b) {
                durationDiff = b.duration() - a.duration();
                startDiff = a.data.getStartStamp() - b.data.getStartStamp();

                return durationDiff || startDiff || a.id - b.id;
            });

        var takenRows, maxRow, row;

        takenRows = intersectors.map(function (token) {
            return token.row();
        }).sort();

        maxRow = Math.max.apply(null, takenRows);

        // find lowest row value that isn't yet taken
        for (row = 0; row <= maxRow; row++) {
            if (takenRows.indexOf(row) < 0)
                break;
        }

        return row;
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

    CWRC.Timeline.Token.prototype.sharesHorizontal = function (other) {
        var thisleft = ko.utils.unwrapObservable(this.xPos);
        var thisRight = thisleft + (ko.utils.unwrapObservable(this.labelWidth) || ko.utils.unwrapObservable(this.maxLabelWidth));
        var otherleft = ko.utils.unwrapObservable(other.xPos);
        var otherRight = otherleft + (ko.utils.unwrapObservable(other.labelWidth) || ko.utils.unwrapObservable(other.maxLabelWidth));

        return ((thisleft >= otherleft && thisleft <= otherRight) || (thisRight >= otherleft && thisRight <= otherRight));
    };

    CWRC.Timeline.Token.prototype.layer = function () {
        return this.isSelected() || this.isHovered() ? null : -this.row();
    };
})();

(function Canvas() {
    CWRC.Timeline.Canvas = function () {
        var self = this;

        self.tokens = ko.pureComputed(function () {
            return CWRC.timedData().map(function (record) {
                return new CWRC.Timeline.Token(record, self);
            });
        });

        self.__pixelsPerMs = ko.observable(1 / CWRC.toMillisec('day'));
        self.rowHeight = ko.observable(CWRC.Timeline.LABEL_HEIGHT);
        self.rowCount = ko.pureComputed(function () {
            return Math.max.apply(null, self.tokens().map(function (token) {
                    return token.row();
                })) + 5;
        });

        self.bounds = {
            height: ko.pureComputed(function () {
                return self.rowCount() * self.rowHeight() + 'px';
            }),
            width: ko.pureComputed(function () {
                var timespan, startStamp, endStamp;

                startStamp = CWRC.earliestStamp();
                endStamp = CWRC.latestStamp();

                if (startStamp == endStamp) {
                    return '100%';
                } else {
                    timespan = (endStamp - startStamp); // in ms

                    return self.stampToPixels(timespan) + self.stampToPixels(CWRC.toMillisec('year')) + 'px';
                }
            }),
            timespan: ko.pureComputed(function () {
                return CWRC.latestStamp() - CWRC.earliestStamp();
            })
        };

        self.layoutTokens();
    };

    CWRC.Timeline.Canvas.prototype.layoutTokens = function () {
        var token, unplacedTokens, cutoff, rowIndex, durationDiff, startDiff, tokenIndex;

        unplacedTokens = this.tokens().slice().sort(function (a, b) {
            durationDiff = b.duration() - a.duration();
            startDiff = a.data.getStartStamp() - b.data.getStartStamp();

            return startDiff || durationDiff || a.id - b.id;
        });

        cutoff = CWRC.earliestStamp();
        rowIndex = 0;

        while (unplacedTokens.length > 0) {
            tokenIndex = function (cutoff) { // this 'extra' function layer avoid stouching a mutable var in a closure
                return unplacedTokens.findIndex(function (token) {
                    return token.data.getStartStamp() >= cutoff;
                })
            }(cutoff);

            if (tokenIndex >= 0) {
                token = unplacedTokens.splice(tokenIndex, 1)[0];

                token.row(rowIndex);

                cutoff = token.startStamp() + this.pixelsToStamp(token.labelWidth());
            }

            if (cutoff >= CWRC.latestStamp() || tokenIndex < 0) {
                // start a new row.
                cutoff = CWRC.earliestStamp();
                rowIndex++;
            }
        }
    };

    CWRC.Timeline.Canvas.prototype.getElement = function () {
        return document.querySelector('.timeline-viewport .canvas');
    };

    CWRC.Timeline.Canvas.prototype.stampToPixels = function (stamp) {
        return stamp * this.__pixelsPerMs();
    };

    CWRC.Timeline.Canvas.prototype.pixelsToStamp = function (px) {
        return px / this.__pixelsPerMs();
    };

    CWRC.Timeline.Canvas.prototype.rowToPixels = function (row) {
        return row * this.rowHeight();
    };

    CWRC.Timeline.Canvas.prototype.pixelsToRow = function (px) {
        return px / this.rowHeight();
    };

    CWRC.Timeline.Canvas.prototype.scaleBy = function (scaleFactor) {
        this.__pixelsPerMs(this.__pixelsPerMs() * scaleFactor);
    }
})();

(function Ruler() {
    CWRC.Timeline.Ruler = function (viewport) {
        var self = this;

        this.viewport = viewport;

        self.units = ['second', 'minute', 'hour', 'day', 'month', 'year', 'decade', 'century', 'millennium'];

        this.unit = ko.pureComputed(function () {
            var msSpan = viewport.canvas.pixelsToStamp(self.getElement().offsetWidth);

            return self.shiftUnit(self.units.find(function (unit) {
                    return msSpan < CWRC.toMillisec(unit)
                }), -1) ||
                self.units[self.units.length - 1];
        });
    };

    CWRC.Timeline.Ruler.prototype.shiftUnit = function (unit, step) {
        var newUnitIndex = this.units.indexOf(unit) + step;

        newUnitIndex = Math.max(newUnitIndex, 0);
        newUnitIndex = Math.min(newUnitIndex, this.units.length - 1);

        return this.units[newUnitIndex];
    };

    CWRC.Timeline.Ruler.prototype.step = function (unit) {
        var spanDate, dates, label, viewportBounds;

        dates = [];
        viewportBounds = this.viewport.bounds;
        spanDate = new Date(viewportBounds.leftStamp());

        spanDate = this.floorDate(spanDate, unit);

        while (spanDate.getTime() <= viewportBounds.rightStamp()) {
            if (/days?/i.test(unit))
                label = spanDate.getUTCDate();
            else if (/months?/i.test(unit))
            // toLocalString options aren't supported in IE 9 & 10.
                label = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][spanDate.getUTCMonth()];
            else if (/decades?|centur(ies|y)|millenni(um|a)/i.test(unit))
                label = spanDate.getUTCFullYear() + 's';
            else
                label = spanDate.getUTCFullYear();

            dates.push({
                label: label,
                position: this.viewport.canvas.stampToPixels(spanDate.getTime() - viewportBounds.leftStamp()) + 'px'
            });

            this.advance(spanDate, unit);
        }

        return dates;
    };

    CWRC.Timeline.Ruler.prototype.getElement = function () {
        return document.querySelector('.timeline-ruler');
    };

    CWRC.Timeline.Ruler.prototype.advance = function (date, unit, amount) {
        amount = amount || 1;

        if (/days?/i.test(unit))
            date.setUTCDate(date.getUTCDate() + amount);
        else if (/months?/i.test(unit))
            date.setUTCMonth(date.getUTCMonth() + amount);
        else if (/years?/i.test(unit))
            date.setUTCFullYear(date.getUTCFullYear() + amount);
        else if (/decades?/i.test(unit))
            date.setUTCFullYear(date.getUTCFullYear() + amount * 10);
        else if (/centur(ies|y)/i.test(unit))
            date.setUTCFullYear(date.getUTCFullYear() + amount * 100);
        else
            date.setUTCFullYear(date.getUTCFullYear() + amount * 1000);
    };

    CWRC.Timeline.Ruler.prototype.floorDate = function (sourceDate, unit) {
        var granularity, yearsBy, floorDate;

        floorDate = new Date(sourceDate);

        if (/months?/i.test(unit))
            floorDate.setUTCMonth(sourceDate.getUTCMonth(), 1);
        else if (!/days?/i.test(unit)) {
            yearsBy = function (granularity, source) {
                return Math.floor(source.getUTCFullYear() / granularity) * granularity
            };

            if (/years?/i.test(unit))
                granularity = 1;
            else if (/decades?/i.test(unit))
                granularity = 10;
            else if (/centur(ies|y)/i.test(unit))
                granularity = 100;
            else
                granularity = 1000;

            floorDate.setUTCFullYear(yearsBy(granularity, sourceDate), 0, 1);
        }

        // assumes that the minimum unit is day, so we can ignore everything lower.
        floorDate.setUTCHours(0, 0, 0);

        return floorDate;
    }
})();


(function Viewport() {
    CWRC.Timeline.Viewport = function (canvas, startDate, initialZoom, scaleStep) {
        var self = this;

        this.canvas = canvas;

        this.scaleStep = scaleStep || CWRC.Timeline.DEFAULT_SCALE_STEP;

        var elementWidth = self.getElement().offsetWidth;

        var startStamp;
        if (startDate == null)
            startStamp = CWRC.earliestStamp();
        else
            startStamp = (new Date(startDate)).getTime() - (self.canvas.pixelsToStamp(elementWidth) / 2);

        // Bounds are stored as time stamps on X axis, number of rows as Y axis. Both are doubles to be
        // rounded only once when converted to pixels
        this.bounds = {
            leftStamp: ko.observable(startStamp),
            topRow: ko.observable(0).extend({number: {minValue: 0}}),
            rightStamp: ko.pureComputed(function () {
                return self.bounds.leftStamp() +
                    self.canvas.pixelsToStamp(elementWidth);
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
            },
            toPx: function () {
                var stampDistance = this.leftStamp() - CWRC.earliestStamp();

                return {
                    left: Math.round(self.canvas.stampToPixels(stampDistance)),
                    right: Math.round(self.canvas.stampToPixels(this.rightStamp())),
                    top: Math.round(self.canvas.rowToPixels(this.topRow())),
                    bottom: Math.round(self.canvas.rowToPixels(this.bottomRow()))
                }
            }
        };

        self.translateTransform = ko.pureComputed(function () {
            return 'translate(' + -self.bounds.toPx().left + 'px, ' + -self.bounds.toPx().top + 'px)'
        });

        // Need to iterate because there's only a zoom-one-step function.
        for (var i = 0; i < initialZoom; i++) {
            self.zoom(elementWidth / 2, 0, false);
        }
    };

    CWRC.Timeline.Viewport.prototype.getElement = function () {
        return document.querySelector('.timeline-viewport');
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

        // limit zooming too far out
        if (!zoomIn && this.bounds.timespan() > canvas.bounds.timespan())
            return;

        scaleFactor = zoomIn ? (this.scaleStep) : (1 / this.scaleStep);

        beforeZoomFocusStamp = this.bounds.leftStamp() + canvas.pixelsToStamp(viewFocusX);

        canvas.scaleBy(scaleFactor);

        afterZoomFocusStamp = this.bounds.leftStamp() + canvas.pixelsToStamp(viewFocusX);

        // readjusting to keep the mouse-hovered point consistent is better for UX and behaviourally matches the map
        this.bounds.leftStamp(this.bounds.leftStamp() - (afterZoomFocusStamp - beforeZoomFocusStamp));
    };

    CWRC.Timeline.Viewport.prototype.panTo = function (stamp, row) {
        var viewportBounds;

        viewportBounds = this.bounds;

        viewportBounds.leftStamp(stamp - (viewportBounds.timespan() / 2));
        viewportBounds.topRow(row - (viewportBounds.visibleRows() / 2) + 0.5); // 0.5 b/c labels are offset by a half row
    };

    // Moves the viewport X pixels right, and Y pixels down.
    CWRC.Timeline.Viewport.prototype.panPixels = function (deltaX, deltaY) {
        var newStamp, newRow;

        newStamp = this.bounds.leftStamp() - this.canvas.pixelsToStamp(deltaX);
        newRow = this.bounds.topRow() - this.canvas.pixelsToRow(deltaY);

        this.bounds.leftStamp(newStamp);
        this.bounds.topRow(newRow);
    }

})();

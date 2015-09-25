ko.components.register('timeline', {
    template: '<section>\
                    <a href="#" data-bind="click: function(){isVisible(!isVisible())}, text: visibleText"></a>\
                    <div>\
                        <span data-bind="text: unplottableCount"></span> of <span data-bind="text: CWRC.rawData().length"></span>\
                        lack time data\
                    </div>\
               </section>\
               <div data-bind="visible: isVisible, event:{mousedown: dragStart, touchstart: dragStart}">\
                    <section id="timeline-viewport" data-bind="event: {wheel: scroll}">\
                        <div class="canvas" data-bind="foreach: timelineRows, \
                                                       style: {\
                                                                width: canvasWidth, \
                                                                transform: zoomTransform, \
                                                                \'-ms-transform\': zoomTransform,\
                                                                \'-webkit-transform\': zoomTransform,\
                                                                transformOrigin: transformOrigin,\
                                                                \'-ms-transform-origin\': transformOrigin,\
                                                                \'-webkit-transform-origin\': transformOrigin\
                                                              }">\
                            <div class="row" data-bind="foreach: $data">\
                                <a href="#" class="event" data-bind="css: { selected: $parents[1].isSelected($data) }, \
                                                                     style: {\
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
                    </section><!-- Ruler disabled until further production available\
                    <section id="timeline-ruler">\
                        <div data-bind="foreach: years, \
                                        style: { \
                                                    width: canvasWidth,\
                                                    transform: rulerTransform \
                                                }">\
                            <div data-bind="text: $data, \
                                            style: { \
                                                     left: $parent.labelPosition($data),\
                                                     width: $parent.labelSize - $parent.lineThickness, \
                                                    \'border-left-width\': $parent.lineThickness \
                                            }"></div>\
                        </div>\
                    </section>-->\
               </div>\
               <!-- debug zoom location -->\
               <div id="zoomPoint" style="display:none; background:red; width: 4px; height:4px; position: absolute; pointer-events: none;"></div>',
    viewModel: function () {
        var self = this;

        self.isVisible = ko.observable(true);
        self.visibleText = ko.computed(function () {
            return self.isVisible() ? 'Hide' : 'Show';
        });

        self.previousDragPosition = ko.observable();

        self.lineThickness = 1; // in px

        self.pixelsPerMs = 1 / CWRC.toMillisec('day');
        self.labelSize = CWRC.toMillisec('year') * self.pixelsPerMs; // px
        self.eventsToPinInfos = Object.create(null);

        self.scaleX = ko.observable(1.0);
        self.scaleY = ko.observable(1.0);

        self.translateX = ko.observable(0);
        self.translateY = ko.observable(0);

        self.transformOriginX = ko.observable(0);        // TODO: remove?
        self.transformOriginY = ko.observable(0);   // TODO: remove?

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

                return (timespan * self.pixelsPerMs) + (self.pixelsPerMs * CWRC.toMillisec('year')); // convert to px
            }
        });

        self.labelPosition = function (year) {
            return self.toPixels(CWRC.toStamp(year.toString()) - self.originStamp())
        };

        self.getPinInfo = function (item) {
            return self.eventsToPinInfos[ko.toJSON(item)];
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
                var leftBounds, rightBounds, topBounds, bottomBounds, elementLeft, elementTop;

                leftBounds = viewport.scrollLeft;
                rightBounds = viewport.scrollLeft + viewport.offsetWidth;
                topBounds = viewport.scrollTop;
                bottomBounds = viewport.scrollTop + viewport.offsetHeight;

                elementLeft = recordLabel.offsetLeft * self.scaleX();
                elementTop = (recordLabel.parentNode.offsetHeight * self.scaleY()) * row; // the parent is actually the offset

                if (elementLeft < leftBounds || elementLeft > rightBounds) {
                    viewport.scrollLeft = parseInt(elementLeft) - (viewport.offsetWidth / 3);
                    if (ruler) // todo: remove when ruler rebuilt
                        ruler.scrollLeft = parseInt(elementLeft) - (viewport.offsetWidth / 3);
                }

                if (elementTop < topBounds || elementTop > bottomBounds) {
                    viewport.scrollTop = parseInt(elementTop);
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
            var scaleFactor, mouseX, mouseY, viewport;

            viewport = document.querySelector('#timeline-viewport');
            var ruler = document.querySelector('#timeline-ruler');


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
            mouseY = viewport.getBoundingClientRect().height / 2; // TODO: actually use mouse location

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

        self.dragStart = function (element, event) {
            var x, y;

            if (event.touches && event.touches.length >= 2) {
                self.pinching = true;
            } else {
                x = event.screenX || event.touches[0].screenX;
                y = event.screenY || event.touches[0].screenY;

                self.previousDragPosition({screenX: x, screenY: y});
            }
        };

        // Note: These are on window rather than the component so that dragging doesn't cut off when the
        // mouse leaves the widget. This is Google Maps behaviour adopted for consistency.
        var stopEventHandler = function (mouseEvent) {
            self.previousDragPosition(null);
        };

        var dragEventHandler = function (mouseEvent) {
            var deltaX, deltaY, mouseX, mouseY;

            if (!self.previousDragPosition())
                return;

            // would've used simpler event.movementX and movementY, but Firefox doesn't support yet.
            mouseX = mouseEvent.screenX || mouseEvent.touches[0].screenX;
            mouseY = mouseEvent.screenY || mouseEvent.touches[0].screenY;

            deltaX = mouseX - self.previousDragPosition().screenX;
            deltaY = mouseY - self.previousDragPosition().screenY;

            self.pan(deltaX, deltaY);

            var x = mouseEvent.screenX || event.touches[0].screenX;
            var y = mouseEvent.screenY || event.touches[0].screenY;
            self.previousDragPosition({screenX: x, screenY: y});
        };

        window.addEventListener('mouseup', stopEventHandler);
        window.addEventListener('touchend', stopEventHandler);

        window.addEventListener('mousemove', dragEventHandler);
        window.addEventListener('touchmove', function (event) {
            if (event.touches.length > 1) {
                alert('Zoom not yet supported on touch.');
                //self.scale(something)
            } else {
                dragEventHandler(event);
            }
        });
    }
});
ko.components.register('timeline', {
    template: '<section>\
                    <a href="#" data-bind="click: function(){isVisible(!isVisible())}, text: visibleText"></a>\
                    <div>\
                        <span data-bind="text: unplottableCount"></span> of <span data-bind="text: CWRC.rawData().length"></span>\
                        lack time data\
                    </div>\
               </section>\
               <div data-bind="visible: isVisible, event:{mousedown: dragStart}">\
                    <section id="timeline-viewport" data-bind="event: {wheel: zoom}">\
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
                    </section>\
                    <section id="timeline-ruler">\
                        <div data-bind="foreach: years, \
                                        style: { \
                                                    width: canvasWidth, \
                                                    transform: zoomTransform, \
                                                    \'-ms-transform\': zoomTransform,\
                                                    \'-webkit-transform\': zoomTransform,\
                                                    transformOrigin: transformOrigin,\
                                                    \'-ms-transform-origin\': transformOrigin,\
                                                    \'-webkit-transform-origin\': transformOrigin\
                                                }">\
                            <div data-bind="text: $data, \
                                            style: { \
                                                     left: $parent.labelPosition($data),\
                                                     width: $parent.labelSize - $parent.lineThickness, \
                                                    \'border-left-width\': $parent.lineThickness \
                                            }"></div>\
                        </div>\
                    </section>\
               </div><div id="derp" style="background:red; top: 18; left: 831; width: 4px; height:4px; position: absolute; pointer-events: none;"></div>',
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

        self.scaleX = ko.observable(1.0);
        self.scaleY = ko.observable(1.0);

        self.translateX = ko.observable(0);
        self.translateY = ko.observable(0);

        self.transformOriginX = ko.observable(0);        // TODO: remove?
        self.transformOriginY = ko.observable(0);   // TODO: remove?

        self.zoomTransform = ko.computed(function () {
            //return 'scale(' + self.scaleX() + ',' + self.scaleY() + ') translate(' + self.translateX() + 'px,' + self.translateY() + 'px)';
            return 'scale(' + self.scaleX() + ',' + self.scaleY() + ')';

        });

        self.transformOrigin = ko.computed(function () {
            return self.transformOriginX() + 'px ' + self.transformOriginY() + 'px';
        });

        self.zoom = function (viewModel, scrollEvent) {
            var scrollDelta = -scrollEvent.deltaY;
            var scaleFactor;

            var viewportContainer = document.querySelector('#timeline-viewport').parentNode;
            var viewport = document.querySelector('#timeline-viewport');
            var canvas = document.querySelector('#timeline-viewport .canvas');

            scaleFactor = scrollDelta > 0 ? 2 : 0.5; // TODO: find a finer ratio. 10%, maybe?


            var mouseX; // relative to viewport
            var mouseY;

            mouseX = viewport.getBoundingClientRect().width / 2; // TODO: actually use mouse location
            mouseY = viewport.getBoundingClientRect().height / 2; // TODO: actually use mouse location

            // TODO: remove the derp point
            document.getElementById('derp').style.left = viewport.getBoundingClientRect().left + (mouseX - 2)
            //document.getElementById('derp').style.top = viewport.getBoundingClientRect().top + (mouseY - 2)


            //self.translateX(-mouseX * scaleFactor);
            //self.translateY(-mouseY * scaleFactor);

            var oldScale = self.scaleX();

            self.scaleX(self.scaleX() * scaleFactor);
            self.scaleY(self.scaleY() * scaleFactor);

            //after the scale, multiply the sacle factor to the raw trasnlation X


            var newScale = self.scaleX();
            var scaleDelta = oldScale - newScale;

            //var direction = scaleFactor >= 1 ? -1 : 1;
            //var translateScale = direction < 0 ? oldScale : newScale

            //console.log('panby')
            //console.log(direction + ' * ' + mouseX + ' * ' + translateScale + ' = ' + (direction * 500 * translateScale))

            //self.pan(direction * mouseX * translateScale, 0);


            var direction = scaleFactor >= 1 ? 1 : -1;
            viewport.scrollLeft *= scaleFactor;

            if (direction > 0) {
                var scalingCompensation = direction * mouseX

                viewport.scrollLeft += scalingCompensation;

                console.log('scaleFactor')
                console.log(scaleFactor)

                console.log('Adding')
                console.log(scalingCompensation)
            } else {
                var scalingCompensation = direction * mouseX * scaleFactor

                viewport.scrollLeft += scalingCompensation;
            }


            console.log('scrollLeft');
            console.log(viewport.scrollLeft)

            console.log(scrollEvent);
            //self.transformOriginX(scrollEvent.clientX - container.getBoundingClientRect().left);
            //self.transformOriginY(scrollEvent.clientY - container.getBoundingClientRect().top);

            //self.transformOriginX('50%');
            //self.transformOriginY('50%');


            return false; // prevent regular page scrolling.
        };

        //document.querySelector('#timeline-viewport').addEventListener('mousemove', function (e) {
        //    console.log('(' + e.screenX + ',' + e.screenY + ')')
        //});

        /*



























         viewport: 10 wide!

         scale 2 -> translate 1/4 new width = translate 1/2 old width

         0
         +-----|-----+  10
         !           !
         +----------|----------+  15 (scaled + corrected)
         -5

         Correction: -5 = -1 * original zoom point






         0
         +--|--------+  10

         -2
         +----|----------------+  18 (scaled + corrected)

         correction: -2 = -original origin location


         I think that the translation is equal to the transform origin.









         */

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

        self.dragStart = function (element, event) {
            self.previousDragEvent(event);
        };

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

                elementLeft = recordLabel.offsetLeft;
                elementTop = recordLabel.parentNode.offsetHeight * row; // the parent is actually the offset

                if (elementLeft < leftBounds || elementLeft > rightBounds) {
                    viewport.scrollLeft = parseInt(elementLeft) - (viewport.offsetWidth / 3);
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

            ruler.scrollLeft -= deltaX;

            console.log('=== scroll location===') // TODO: remove
            console.log(viewport.scrollTop)
            console.log(viewport.scrollLeft)
        };

        // Note: These are on window rather than the component so that dragging doesn't cut off when the
        // mouse leaves the widget. This is Google Maps behaviour adopted for consistency.
        window.addEventListener('mouseup', function (mouseEvent) {
            self.previousDragEvent(null);
        });

        window.addEventListener('mousemove', function (mouseEvent) {
            var deltaX, deltaY;

            if (!self.previousDragEvent())
                return;

            // would've used simpler event.movementX and movementY, but Firefox doesn't support yet.
            deltaX = mouseEvent.screenX - self.previousDragEvent().screenX;
            deltaY = mouseEvent.screenY - self.previousDragEvent().screenY;

            self.pan(deltaX, deltaY);

            self.previousDragEvent(mouseEvent);
        });
    }
});
/* 
 * Model a zoombar on the 1st band of the timeline
 * @precon - timeline must be fully constructed and layed out
 */
TimelineBandZoomBar = function (tl, bandNumber) {
    this.timeline = tl;
    this.document = this.timeline.getDocument();
    this.bandNumber = bandNumber;
    this.bandInfo = this.timeline._bandInfos[bandNumber];
    this.zoomStepsLength = this.bandInfo.zoomSteps.length;
    this.bandId = "timeline-band-" + bandNumber;
    this.containerDivId = tl._containerDiv.id;
    this.stemDivId = this.containerDivId + "-" + this.bandId;
    this.sliderIconSelector = "img#" + this.stemDivId + "-ZoomSlider_icon";
    this.sliderStepPx = 11;

    var zoomInDiv = this.document.createElement("div");
    zoomInDiv.id = this.stemDivId + "-ZoomIn";
    zoomInDiv.className = "ZoomIn";
    this.timeline.addDiv(zoomInDiv);

    var zoomInElmt = this.document.createElement("img");
    zoomInElmt.id = this.stemDivId + "-ZoomIn_icon";
    zoomInElmt.className = "ZoomIn_icon";
    zoomInElmt.setAttribute("src", "img/hzoom-plus-mini.png");
    zoomInDiv.appendChild(zoomInElmt);
    this.zoomInElmt = zoomInElmt;

    var zoomSliderDiv = this.document.createElement("div");
    zoomSliderDiv.id = this.stemDivId + "-ZoomSlider";
    zoomSliderDiv.className = "ZoomSlider";
    this.timeline.addDiv(zoomSliderDiv);

    var zoomSliderElmt = this.document.createElement("img");
    zoomSliderElmt.id = this.stemDivId + "-ZoomSlider_icon";
    zoomSliderElmt.className = "ZoomSlider_icon";
    zoomSliderElmt.setAttribute("src", "img/hslider.png");
    zoomSliderDiv.appendChild(zoomSliderElmt);

    var zoomOutDiv = this.document.createElement("div");
    zoomOutDiv.id = this.stemDivId + "-ZoomOut";
    zoomOutDiv.className = "ZoomOut";
    this.timeline.addDiv(zoomOutDiv);

    var zoomOutElmt = this.document.createElement("img");
    zoomOutElmt.id = this.stemDivId + "-ZoomOut";
    zoomOutElmt.className = "ZoomOut_icon";
    zoomOutElmt.setAttribute("src", "img/hzoom-minus-mini.png");
    zoomOutDiv.appendChild(zoomOutElmt);

    SimileAjax.DOM.registerEventWithObject(zoomSliderDiv, "click", this, "onSliderClick");
    SimileAjax.DOM.registerEventWithObject(zoomInElmt, "click", this, "onPlusClick");
    SimileAjax.DOM.registerEventWithObject(zoomOutElmt, "click", this, "onMinusClick");

    var sliderStartPos = ((this.bandInfo.zoomIndex * this.sliderStepPx) + 1).toString() + "px";
    $(this.sliderIconSelector).css({
        left: sliderStartPos
    });

    var theBand = this.document.getElementById(this.bandId);
    this.bandElement = theBand;

    this.band = this.timeline._bands[bandNumber];
    this.band.zoomBar = this;
}

// @precon - zoom must have already been updated
TimelineBandZoomBar.prototype.updateSlider = function () {
    var theNewSliderPos = (this.band._zoomIndex * this.sliderStepPx) + 1;
    var strNewSliderPos = theNewSliderPos + "px";

    $(this.sliderIconSelector).animate({
        left: strNewSliderPos
    }, 50);
}

TimelineBandZoomBar.prototype.onSliderClick = function (innerFrame, evt, target) {
    var now = new Date();
    now = now.getTime();

    if (!this.lastScrollTime || ((now - this.lastScrollTime) > 100)) {
        // limit actions due to FF3 sending multiple events back to back
        this.lastScrollTime = now; // prevent bubble
        var position = $(this.zoomInElmt).offset();
        var elmtWidth = $(this.zoomInElmt).width();

        var divXPos = evt.clientX;
        var offsetx = position.left + elmtWidth;
        var stepPx = this.sliderStepPx;

        var theZoomPos = Math.floor((divXPos - offsetx) / this.sliderStepPx);

        if (theZoomPos > (this.zoomStepsLength - 1)) {
            theZoomPos = (this.zoomStepsLength - 1);
        }

        if (theZoomPos < 0) {
            theZoomPos = 0;
        }

        if (this.band._zoomIndex != theZoomPos) {
            var theNewSliderPos = (theZoomPos * this.sliderStepPx) + 1;
            var strNewSliderPos = theNewSliderPos + "px";
            // todo this should be updateSlider
            $(this.sliderIconSelector).stop().animate({
                left: strNewSliderPos
            }, 300);

            this.timeline.zoomToIndex(theZoomPos, this.bandElement);
        }
    }

    if (evt.stopPropagation) {
        evt.stopPropagation();
    }
    evt.cancelBubble = true;

    // prevent the default action
    if (evt.preventDefault) {
        evt.preventDefault();
    }
    evt.returnValue = false;
};

TimelineBandZoomBar.prototype.onPlusClick = function (innerFrame, evt, target) {
    var now = new Date();
    now = now.getTime();

    if (!this.lastScrollTime || ((now - this.lastScrollTime) > 100)) {
        // limit actions due to FF3 sending multiple events back to back
        this.lastScrollTime = now; // prevent bubble
        if (this.band._zoomIndex > 0) {
            this.timeline.zoomToIndex(this.band._zoomIndex - 1, this.bandElement);
            this.updateSlider();
        }
    }

    if (evt.stopPropagation) {
        evt.stopPropagation();
    }
    evt.cancelBubble = true;

    // prevent the default action
    if (evt.preventDefault) {
        evt.preventDefault();
    }
    evt.returnValue = false;
};

TimelineBandZoomBar.prototype.onMinusClick = function (innerFrame, evt, target) {
    var now = new Date();
    now = now.getTime();

    if (!this.lastScrollTime || ((now - this.lastScrollTime) > 100)) {
        // limit actions due to FF3 sending multiple events back to back
        this.lastScrollTime = now; // prevent bubble
        if (this.band._zoomIndex < (this.zoomStepsLength - 1)) {
            this.timeline.zoomToIndex(this.band._zoomIndex + 1, this.bandElement);
            this.updateSlider();
        }
    }

    if (evt.stopPropagation) {
        evt.stopPropagation();
    }
    evt.cancelBubble = true;

    // prevent the default action
    if (evt.preventDefault) {
        evt.preventDefault();
    }
    evt.returnValue = false;
};

// utility function to help get a correct zoom increment
function nthroot(x, n) {
    var retVal;

    try {
        var negate = n % 2 == 1 && x < 0;
        if (negate) x = -x;
        var possible = Math.pow(x, 1 / n);
        n = Math.pow(possible, n);
        if (Math.abs(x - n) < 1 && (x > 0 == n > 0)) retVal = negate ? -possible : possible;
    } catch (e) { /* nothing needed return value will ne undefined*/
    }

    return retVal;
}

// utitliy function to calculate the step values
// N.B. works for same unit or unit switch from DECADE to CENTURY - DAY to HOUR
function initZoomSteps(noOfSteps, greatestMag, leastMag) {
    var newZoomSteps;

    if ((noOfSteps > 1 && noOfSteps < 20) && leastMag != undefined && greatestMag != undefined) {

        var greatestMagToLeastMagUnit = greatestMag.pixelsPerInterval;
	    
	if(greatestMag.unit != leastMag.unit){
		if(greatestMag.unit == Timeline.DateTime.DECADE && leastMag.unit == Timeline.DateTime.DECADE){
			greatestMagToLeastMagUnit = greatestMag.pixelsPerInterval * 10;
		}
		
		if(greatestMag.unit == Timeline.DateTime.HOUR && leastMag.unit == Timeline.DateTime.DAY){
			greatestMagToLeastMagUnit = greatestMag.pixelsPerInterval * 24;
		}
	}

        if (greatestMagToLeastMagUnit > leastMag.pixelsPerInterval) {
            var sizeDiv = greatestMagToLeastMagUnit / leastMag.pixelsPerInterval;
            var theRoot = nthroot(sizeDiv, noOfSteps - 1);
            var ratio = theRoot - 1;

            newZoomSteps = new Array();

            for (var i = (noOfSteps - 1); i >= 0; --i) {
                var theStepData = new Object();
                var stepValue = Math.round(leastMag.pixelsPerInterval * Math.pow(1 + ratio, i));

                if (greatestMag.unit != leastMag.unit) {
                    var unitSwitchValue = 500;
                    if (leastMag.unit == Timeline.DateTime.DAY) {
                        unitSwitchValue = 1200;
                    }

                    if (stepValue > unitSwitchValue) {
                        theStepData.pixelsPerInterval = Math.floor(stepValue / 10);
                        theStepData.unit = greatestMag.unit;
                    } else {
                        theStepData.pixelsPerInterval = stepValue;
                        theStepData.unit = leastMag.unit;
                    }
                } else {
                    theStepData.pixelsPerInterval = stepValue;
                    theStepData.unit = leastMag.unit;
                }

                newZoomSteps.push(theStepData);
            }
        }
    }

    return newZoomSteps;
}
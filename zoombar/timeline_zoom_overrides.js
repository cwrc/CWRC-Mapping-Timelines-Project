// override to make sure that mouse wheel causes scroll rather than zoom
Timeline._Band.prototype._onMouseScroll = function(innerFrame, evt, target) {
    var now = new Date();
    now = now.getTime();

    if (!this._lastScrollTime || ((now - this._lastScrollTime) > 100)) {
        // limit 1 scroll per 200ms due to FF3 sending multiple events back to back
        this._lastScrollTime = now;

        var delta = 0;
        if (evt.wheelDelta) {
            delta = evt.wheelDelta/120;
        } else if (evt.detail) {
            delta = -evt.detail/3;
        }
    
        // either scroll or zoom
        var mouseWheel = this._theme.mouseWheel;
        var loc = SimileAjax.DOM.getEventRelativeCoordinates(evt, innerFrame);
    
        if (mouseWheel === 'zoom') {
            if (delta != 0) {
                var zoomIn;
                if (delta > 0)
                    zoomIn = true;
                if (delta < 0)
                    zoomIn = false;
                
                // call zoom on the timeline so we could zoom multiple bands if desired
                this._timeline.zoom(zoomIn, loc.x, loc.y, innerFrame);
                
                if(this._zoomBar != null){
                    this._zoomBar._updateSlider();
                }
            }
        }
        else if (mouseWheel === 'scroll') {
            var move_amt = 50 * (delta < 0 ? -1 : 1);
            this._moveEther(move_amt);
        }
    }

    // prevent bubble
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

// override to change the date lookup to be -shift
Timeline._Impl.prototype.shiftOK = function(index, shift) {
    // Returns true if the proposed shift is ok
    //
    // Positive shift means going back in time
    var going_back = shift > 0,
    going_forward = shift < 0;
    
    // Is there an edge?
    if ((going_back    && this.timeline_start == null) ||
        (going_forward && this.timeline_stop  == null) ||
        (shift == 0)) {
        return (true);  // early return
    }
    
    // If any of the bands has noted that it is changing the others,
    // then this shift is a secondary shift in reaction to the real shift,
    // which already happened. In such cases, ignore it. (The issue is
    // that a positive original shift can cause a negative secondary shift, 
    // as the bands adjust.)
    var secondary_shift = false;
    for (var i = 0; i < this._bands.length && !secondary_shift; i++) {
        secondary_shift = this._bands[i].busy();
    }
    if (secondary_shift) {
        return(true); // early return
    }
    
    // If we are already at an edge, then don't even think about going any further
    if ((going_back    && this.timeline_at_start) ||
        (going_forward && this.timeline_at_stop)) {
        return (false);  // early return
    }
    
    // Need to check all the bands
    var ok = false; // return value
    // If any of the bands will be or are showing an ok date, then let the shift proceed.
 
    for (var i = 0; i < this._bands.length && !ok; i++) {
        var band = this._bands[i];
        if (going_back) {
            ok = (i == index ? band.getMinVisibleDateAfterDelta(-shift) : band.getMinVisibleDate())
            >= this.timeline_start;
        } else {
            ok = (i == index ? band.getMaxVisibleDateAfterDelta(-shift) : band.getMaxVisibleDate())
            <= this.timeline_stop;
        }	
    }
    
    // process results
    if (going_back) {
        this.timeline_at_start = !ok;
        this.timeline_at_stop = false;
    } else {
        this.timeline_at_stop = !ok;
        this.timeline_at_start = false;
    }
    // This is where you could have an effect once per hitting an
    // edge of the Timeline. Eg jitter the Timeline
    //if (!ok) {
    //alert(going_back ? "At beginning" : "At end");
    //}
    return (ok);
};

// new functions to allow zoom to another index in one step
// rather than calling zoom multiple times
Timeline._Impl.prototype.zoomToIndex = function(theZoomIndex, theBand){
    this.zoomto(theZoomIndex, theBand);
}

Timeline._Impl.prototype.zoomto = function (zoomTo, target) {
    var matcher = new RegExp("^timeline-band-([0-9]+)$");
    var bandIndex = null;
  
    var result = matcher.exec(target.id);
    if (result) {
        bandIndex = parseInt(result[1]);
    }

    if (bandIndex != null) {
        this._bands[bandIndex].zoomto(zoomTo, this.timeline_start, this.timeline_stop);
    }   

    this.paint();
    
//    var band = this._bands[bandIndex];
//    var minVisDate = band.getMinVisibleDate();
//    var maxVisDate = band.getMaxVisibleDate();
//    if (minVisDate <= this.timeline_start) {
//        this.timeline_at_start = true;
//    }
//       
//    if(maxVisDate >= this.timeline_stop){
//        this.timeline_at_stop = true;
//    }	
}

Timeline._Band.prototype.zoomto = function(zoomTo, timeline_start, timeline_stop) {
    if (!this._zoomSteps) {
        // zoom disabled
        return;
    }
 
    // get centre before zoom so that we can centre on it afterwards    
    var centreDate = this.getCenterVisibleDate();

    var prevZoomIndex = this._zoomIndex;
    var netIntervalChange = this._ether.zoomto(zoomTo);
    this._etherPainter.zoom(netIntervalChange);

    var centreDateDatePosAfterZoom = this._ether.dateToPixelOffset(centreDate);
    var afterZoomCentreDate = this.getCenterVisibleDate();
    var afterZoomCentreDateDatePos = this._ether.dateToPixelOffset(afterZoomCentreDate);
   
    if(zoomTo > prevZoomIndex && !(timeline_start === null && timeline_stop === null)){

        var hasMovedToStopLimit = false;  // similar to at timeline start || stop
        var hasMovedToStartLimit = false;  // similar to at timeline start || stop

        var pxLatestVisibleDate = this._viewLength;
        var pxStopDate = this._ether.dateToPixelOffset(timeline_stop);
        var theStopEndDiff = pxLatestVisibleDate - pxStopDate;
 
        var pxEarliestVisibleDate = 0;
        var pxStartDate = this._ether.dateToPixelOffset(timeline_start);
        var theStartEndDiff = pxEarliestVisibleDate - pxStartDate;  

        var theStartStopDiff = pxStopDate - pxStartDate;  
        var theEarliestLatestDiff = this._viewLength;  
        var theDiffDiff = Math.ceil(theEarliestLatestDiff - theStartStopDiff);

        var centreDiffs = Math.round(afterZoomCentreDateDatePos - centreDateDatePosAfterZoom);
        var netChange = centreDiffs; 

        if(theStopEndDiff > 0 &&
            theStartEndDiff < 0){
            return;
        }
        
        // need to watch precision here
        // if moving forward need ceil and backward need floor???
        // otherwise Timeline.shiftOK rejects it
        if(theStopEndDiff > 0){    
            var backPixels = (Math.floor(theStopEndDiff) - Math.max(0, theDiffDiff));
            if(backPixels > 0){
                this._moveEther(backPixels);
            }
            hasMovedToStopLimit = true;
        } else {
            if(theStartEndDiff < 0){
                var forwardPixels = (Math.ceil(theStartEndDiff)  + Math.max(0, theDiffDiff));        
                if(forwardPixels < 0){
                    this._moveEther(forwardPixels);
                }
                hasMovedToStartLimit = true;
            } 
        }   
        
        if(netChange <= 0){
            // moving forward 
            // if at stop limit go no further
            // otherwise move either the net change or the amount that makes 
            // start date visible
            if(!hasMovedToStopLimit) {
                if(theStartEndDiff > 0){
                    var theMoveForward = Math.max(-theStartEndDiff, netChange);
                    this._moveEther(Math.floor(theMoveForward));
                } else {
                ///if the start date was already visible
                // it has been moved to the far left in the limit code  
                }                               
            }            
        } else {
            // moving back
            // if at start limit go no further
            // otherwise move either the net change or the amount that makes 
            // stop date visible           
            if(!hasMovedToStartLimit) {
                if(theStopEndDiff < 0){
                    var theMoveBack = Math.min(-theStopEndDiff, netChange);
                    this._moveEther(Math.ceil(theMoveBack));
                } else {
                ///if the stop date was already visible
                // it has been moved to the far right in the limit code  
                }                               
            }  
        }
	
	// force a redraw
	this._moveEther(0);
    } else {
        this.setCenterVisibleDate(centreDate);
    }
}

Timeline.LinearEther.prototype.zoomto = function(zoomTo) {
    var netIntervalChange = 0;
    var currentZoomIndex = this._band._zoomIndex;
    var newZoomIndex = zoomTo;

    if (zoomTo != currentZoomIndex && 
        zoomTo >= 0 && zoomTo < this._band._zoomSteps.length) {
        this._band._zoomIndex = newZoomIndex;  
        this._interval = SimileAjax.DateTime.gregorianUnitLengths[this._band._zoomSteps[newZoomIndex].unit];
        this._pixelsPerInterval = this._band._zoomSteps[newZoomIndex].pixelsPerInterval;
        netIntervalChange = this._band._zoomSteps[newZoomIndex].unit - this._band._zoomSteps[currentZoomIndex].unit;
    }

    return netIntervalChange;
};

Timeline._Band.prototype._onMouseOut = function(innerFrame, evt, target) {
		document.getSelection().removeAllRanges();

    var coords = SimileAjax.DOM.getEventRelativeCoordinates(evt, innerFrame);
    coords.x += this._viewOffset;
    if (coords.x < 0 || coords.x > innerFrame.offsetWidth ||
        coords.y < 0 || coords.y > innerFrame.offsetHeight) {
        this._dragging = false;
    }
};

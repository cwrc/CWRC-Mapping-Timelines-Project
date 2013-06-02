/* 
 * Model a horizontal pan control the specified band of the timeline
 * @precon - timeline must be fully constructed and layed out
 */

TimelineBandPanControl = function(tl, bandNumber) {
    this._timeline = tl;
    this._document = this._timeline.getDocument();
    this._bandNumber = bandNumber;
    this._bandInfo = this._timeline._bandInfos[bandNumber];
    this._bandId = "timeline-band-" + bandNumber;
    this._containerDivId = tl._containerDiv.id;
    this._stemDivId = this._containerDivId + "-" + this._bandId;
      
    var panLeftDiv = this._document.createElement("div");                 
    panLeftDiv.id = this._stemDivId + "-PanLeft"; 
    panLeftDiv.className = "PanLeft";
    this._timeline.addDiv(panLeftDiv);
    
    var panLeftElmt = this._document.createElement("img");
    panLeftElmt.id = this._stemDivId + "-PanLeft_icon";
    panLeftElmt.className = "PanLeft_icon"; 
    panLeftElmt.setAttribute("src", "img/west-mini.png");
    panLeftDiv.appendChild(panLeftElmt);
    this.panLeftElmt = panLeftElmt;
    
    var panRightDiv = this._document.createElement("div");
    panRightDiv.id = this._stemDivId + "-PanRight";
    panRightDiv.className = "PanRight";
    this._timeline.addDiv(panRightDiv);
    
    var panRightElmt = this._document.createElement("img");
    panRightElmt.id = this._stemDivId + "-PanRight_icon";
    panRightElmt.className = "PanRight_icon";  
    panRightElmt.setAttribute("src", "img/east-mini.png");
    panRightDiv.appendChild(panRightElmt);
    this.panRightElmt = panRightElmt;
    
    SimileAjax.DOM.registerEventWithObject(panLeftElmt, "click", this, "_onPanLeftClick");
    SimileAjax.DOM.registerEventWithObject(panRightElmt, "click", this, "_onPanRightClick");
    
    var theBand = this._document.getElementById(this._bandId);
    this._bandElement = theBand;
    
    this._band = this._timeline._bands[bandNumber];
    this._band._panControl = this;
}

TimelineBandPanControl.prototype._onPanLeftClick = function(innerFrame, evt, target) {
    var now = new Date();
    now = now.getTime();

    if (!this._lastScrollTime || ((now - this._lastScrollTime) > 100)) {
        // limit actions due to FF3 sending multiple events back to back
        this._lastScrollTime = now;    // prevent bubble
	    
     	var move_amt = 50 *  1;
	this._band._moveEther(move_amt);     
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

TimelineBandPanControl.prototype._onPanRightClick = function(innerFrame, evt, target) {
    var now = new Date();
    now = now.getTime();

    if (!this._lastScrollTime || ((now - this._lastScrollTime) > 100)) {
        // limit actions due to FF3 sending multiple events back to back
        this._lastScrollTime = now;    // prevent bubble
        	    
     	var move_amt = 50 *  -1;
	this._band._moveEther(move_amt);    
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



function sortItemByTimeFunction(a, b){
	if(a.getStartTime() > b.getStartTime())
	return 1;
	
	if(a.getStartTime() < b.getStartTime())
	return -1;
	
	return 0;
}
 
/**
 * Standard open info window function, using static text in map window
 */
TimeMapItem.openInfoWindowCombined = function() {
    var item = this,
    html = item.getInfoHtml(),
    ds = item.dataset,
    placemark = item.placemark,
    datasets = ds.timemap.datasets;	

    // scroll timeline if necessary
    if (!item.onVisibleTimeline()) {
        ds.timemap.scrollToDate(item.getStart());
    }
    
    var allItemsHere = new Array();
    allItemsHere.push(item);
    
    if(item.fromTimeline){
	    item.fromTimeline = false;
    } else {
	    var thisLocation = item.placemark.location;
	    var thisLat = thisLocation.lat;
	    var thisLon = thisLocation.lon;
	    var thisTitle = item.opts.title;
	    var thisStartTime = item.getStartTime();
		
	    for (var key in datasets) {
			var theDataset = datasets[key];
				
			if(theDataset.visible){
				var dsLength = theDataset.items.length;
				
				for (var i = 0; i < dsLength; i++) {
					var theItem = theDataset.items[i];
					var placemarkVisible = theItem.placemarkVisible;
					var theLocation = theItem.placemark.location;
					var theLat = theLocation.lat;
					var theLon = theLocation.lon;
					var theTitle = theItem.opts.title;
					var theStartTime = theItem.getStartTime();


					if(theLat == thisLat && theLon == thisLon){
						if(placemarkVisible){
							if(!(thisTitle == theTitle &&
								thisStartTime == theStartTime)){
								allItemsHere.push(theItem);
							}
						}
					}
				}
			}
	    }
    }
	
	if(allItemsHere.length > 1){
		allItemsHere.sort(sortItemByTimeFunction);

		var firstHtml = allItemsHere[0].getInfoHtml();
		var locIndex = firstHtml.indexOf('</a></div>');

		if(locIndex > 0 && locIndex + 10 < firstHtml.length){
			var htmlJustLocation = firstHtml.substring(0, locIndex + 10);
			html = htmlJustLocation;
		}

		var i = 0;
		for(i=0; i<allItemsHere.length; i++) { 
			var currentItem = allItemsHere[i]; 
			var otherHtml  = currentItem.getInfoHtml();
			var locEndIndex = otherHtml.indexOf('</a></div>');

			if(locEndIndex > 0 && locEndIndex + 10 < otherHtml.length){
				var htmlMinusLocation = otherHtml.substring(locEndIndex + 10, otherHtml.length);
				html = html + htmlMinusLocation;
			}
		}
	}

	// open window
	if (item.getType() == "marker" && placemark.api) {
		placemark.setInfoBubble(html);
		placemark.openBubble();
		// deselect when window is closed
		item.closeHandler = placemark.closeInfoBubble.addHandler(function() { 
		    // deselect
		    ds.timemap.setSelected(undefined);
		    // kill self
		    placemark.closeInfoBubble.removeHandler(item.closeHandler);
		});
	} else {
		item.map.openBubble(item.getInfoPoint(), html);
		item.map.tmBubbleItem = item;
	}
}

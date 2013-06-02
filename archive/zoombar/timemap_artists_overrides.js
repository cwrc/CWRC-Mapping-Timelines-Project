function sortItemByTimeFunction(a, b) {
    if (a.getStartTime() > b.getStartTime()) return 1;

    if (a.getStartTime() < b.getStartTime()) return -1;

    return 0;
}

/**
 * Open info window for markers (not polygons or polylines)
 */
TimeMapItem.openInfoWindowMap = function () {
    var item = this,
        html = item.getInfoHtml(),
        ds = item.dataset,
        placemark = item.placemark,
        datasets = ds.timemap.datasets;

    if (item.getType() == "marker" && placemark.api) {
        // scroll timeline if necessary
        if (!item.onVisibleTimeline()) {
            ds.timemap.scrollToDate(item.getStart());
        }

        var allItemsHere = new Array();
	allItemsHere.push(item);

        var thisLocation = item.placemark.location;
        var thisLat = thisLocation.lat;
        var thisLon = thisLocation.lon;
        var thisTitle = item.opts.title;
        var thisStartTime = item.getStartTime();

        var dsLength = ds.items.length;

        for (var i = 0; i < dsLength; i++) {

	var theItem = ds.items[i];
                 if (theItem.getType() === "marker") {
   	 var placemarkVisible = theItem.placemarkVisible;
            var theLocation = theItem.placemark.location;
            var theLat = theLocation.lat;
            var theLon = theLocation.lon;
            var theTitle = theItem.opts.title;
            var theStartTime = theItem.getStartTime();

            if (theLat == thisLat && theLon == thisLon) {

                    if (placemarkVisible) {
                        if (!(thisTitle == theTitle &&
                            thisStartTime == theStartTime)){
                            allItemsHere.push(theItem);
                        }
                        }
                    }
                }
            }

            if (allItemsHere.length > 1) {
		html = "";
                allItemsHere.sort(sortItemByTimeFunction);

                var i = 0;
                for (i = 0; i < allItemsHere.length; i++) {
                    var currentItem = allItemsHere[i];
			var currentItemHtml =  currentItem.getInfoHtml();
                    html = html + currentItemHtml;
                }
            }

            placemark.setInfoBubble(html);
            placemark.openBubble();
            // deselect when window is closed
            item.closeHandler = placemark.closeInfoBubble.addHandler(function () {
                // deselect
                ds.timemap.setSelected(undefined);
                // kill self
                placemark.closeInfoBubble.removeHandler(item.closeHandler);
            });
        }
    }

    /**
     * Info window should appear at position on map that is visible 
     * for this item.
     */
    TimeMapItem.openInfoWindowTimeline = function () {
        var item = this,
            html = item.getInfoHtml(),
            ds = item.dataset,
            placemark = item.placemark,
            // so this needs to be one of the visible placemarks (in the timeframe)
            datasets = ds.timemap.datasets;

        // DO NOT do this 
        // scroll timeline if necessary
        /*  if (!item.onVisibleTimeline()) {
        ds.timemap.scrollToDate(item.getStart());
    }*/

        var allItemsForTimeframe = new Array();

        // need to make sure that the marker is relevant
        // i.e. has to have the same title as this item
        for (var key in datasets) {
            if (key !== ds.id) {
                var theDataset = datasets[key];

                if (theDataset.visible) {
                    var dsLength = theDataset.items.length;

                    for (var i = 0; i < dsLength; i++) {
                        var theItem = theDataset.items[i];

                        // only want points (type = marker) not polylines
                        if (theItem.getType() === "marker" && item.opts.title === theItem.opts.title) {
                            if (theItem.onVisibleTimeline()) {
                                allItemsForTimeframe.push(theItem);
                            }
                        }
                    }
                }
            }
        }


        if (allItemsForTimeframe.length > 0) {
            allItemsForTimeframe.sort(sortItemByTimeFunction);

            var firstHtml = allItemsForTimeframe[0].getInfoHtml();

            item = allItemsForTimeframe[0];
            html = firstHtml;
            ds = item.dataset;
            placemark = item.placemark;
        };

        // open window
        if (item.getType() == "marker" && placemark.api) {
            placemark.setInfoBubble(html);
            placemark.openBubble();
            // deselect when window is closed
            item.closeHandler = placemark.closeInfoBubble.addHandler(function () {
                // deselect
                ds.timemap.setSelected(undefined);
                // kill self
                placemark.closeInfoBubble.removeHandler(item.closeHandler);
            });
        } else {
            item.map.openBubble(item.getInfoPoint(), html);
            item.map.tmBubbleItem = item;
        }
    };
    
TimeMapItem.closeInfoWindowTimeline = function() {
    var item = this;
    if (item.getType() == "marker") {
        //item.placemark.closeBubble();
    } else {
        if (item == item.map.tmBubbleItem) {
            item.map.closeBubble();
           // item.map.tmBubbleItem = null;
        }
    }
};
 
<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	
	<title>Plot-It</title>
	<script src="libs/simile/exhibit-api.js" type="text/javascript"></script> 
	<script src="libs/simile/extensions/map/map-extension.js" type="text/javascript"></script> 
	<script src="libs/simile/extensions/time/time-extension.js" type="text/javascript" type="text/javascript"></script>
    
	<!-- Static datasets -->
	<link href="transformers/cache/multimedia.json" type="application/json" rel="exhibit/data" />
	<link href="transformers/cache/biblifo.json" type="application/json" rel="exhibit/data" />
	<link href="transformers/cache/lglc.json" type="application/json" rel="exhibit/data" />
	<link href="transformers/cache/orlando.json" type="application/json" rel="exhibit/data" />
	
	<link href="libs/simile/styles/common.css" type="text/css" rel="stylesheet" />
	<link href="libs/simile/styles/styles.css" type="text/css" rel="stylesheet" />
    
    <style>
    .exhibit-slider
    {
        border: 1px solid #CCC;
        padding-bottom: 5px;
        background-color: #E3E6EC;
    }
    .multiGroupEvents
    {
		width: 300px;
		height: 100px;
		overflow: auto;
    }
    </style>

    <script type="text/javascript">
		var zebraStyler = function(item, database, tr)
		{
			if (tr.rowIndex % 2)
			{
				tr.style.background = '#eee';
			}
			else
			{
				tr.style.background = '#ccc';
			}
		}
		
		function toggleTimeline()
        {
            $('#timelineArea').toggle();
            if ($('#timelineToggle').text() == 'Show Timeline')
            {
                $('#timelineToggle').text('Hide Timeline');
            }
            else 
            {
                $('#timelineToggle').text('Show Timeline');
            }
        }

        function toggleMap()
        {
            $('#mapArea').toggle();
            if ($('#mapToggle').text() == 'Show Panel')
            {
                $('#historicalMapToggle').show();
                $('#mapToggle').text('Hide Panel');
            }
            else 
            {
                $('#historicalMapToggle').hide();
                $('#mapToggle').text('Show Panel');
            }
        }

        var map; 
        var oldMapViewReconstruct = Exhibit.MapView.prototype._reconstruct; 
        Exhibit.MapView.prototype._reconstruct = function()
        { 
            oldMapViewReconstruct.call(this); 
            map = this._map;
            
            var swBound = new google.maps.LatLng(27.87, -181.56);
			var neBound = new google.maps.LatLng(81.69, -17.58);
			imageBounds = new google.maps.LatLngBounds(swBound, neBound);

            historicalOverlay = new google.maps.GroundOverlay
            (
                'maps/BNA_1854.png',
                imageBounds
			);
        }

        function addOverlay()
        {
            historicalOverlay.setMap(map);
        }

        function removeOverlay()
        {
            historicalOverlay.setMap(null);
        }        

        function toggleHistoricalMap()
        {
            if ($('#historicalMapToggle').text() == 'Show Historical Map')
            {
                addOverlay();
                $('#historicalMapToggle').text('Hide Historical Map')
            }
            else
            {
                removeOverlay();
                $('#historicalMapToggle').text('Show Historical Map')
            }
        }
    </script>
</head>

<body>
<table id="frame">
<tr>
	<td id="sidebar">
		<h1><a href="index.php">Plot-It</a></h1>
		<div ex:role="coordinator" id="bubble-coordinator"></div>

		<b>How to use search</b><br />
		<small>Search below by choosing a facet or typing keywords. To restart your search, click on "Reset all Filters" above the map.</small>
		<hr />
							
		<p><a id="historicalMapToggle" style="font-size: 11px; font-weight: bold; color: #000;" href="#" onclick="toggleHistoricalMap();">Show Historical Map</a></p>

		<div id="exhibit-browse-panel">
			<b>Search</b>
			<div ex:role="facet" ex:facetClass="TextSearch"></div>
			<div ex:role="facet" ex:expression=".startDate" ex:facetLabel="Date Slider" ex:facetClass="Slider" ex:horizontal="true" ex:precision="1" ex:histogram="true" ex:width="245px"></div>
			<div ex:role="facet" ex:expression=".group" ex:facetLabel="Collection" ex:height="3em"></div>
		</div>
	</td>
					
	<td id="content">
		<div class="item" ex:role="lens" style="display: none; overflow: auto; width: 300px; height: 100px;">
			
			<!-- Begin popup. If only this is set, it will be used for the map markers too. Can be disabled for timeline, and show on map only as well -->
			<table cellpadding="2" width="100%" style="font-size: 13px; color: #777; font-family: Arial, Tahoma, Sans-serif;">
			<tr>
				<td width="1">
					<img ex:if-exists=".images" ex:src-content=".images" width="100px" />
				</td>
				<td width="1">
					<iframe width="150" height="150" ex:if-exists=".videos" ex:src-content=".videos" frameborder="0" allowfullscreen></iframe>
				</td>
				<td>
					<div>
						<span ex:if-exists=".location">
							<b><small>LOCATION</small></b> <span ex:content=".location"></span><br />
						</span>
						<span ex:if-exists=".startDate">
							<b><small>DATE</small></b> 
							<span ex:content=".startDate"></span>
							<span ex:if-exists=".endDate">
							 <b><small>TO</small></b> <span ex:content=".endDate"></span>
							</span>
							<br />
						</span>
						<b><small>TITLE</small></b> <span ex:content=".longLabel"></span><br />
						<b><small>NOTES</small></b> <span ex:content=".description"></span><br />
						<b><small><a target="_blank" ex:if-exists=".urls" ex:href-content=".urls">MORE INFO</a></small></b> 
						<b><small><a target="_blank" ex:if-exists=".source" ex:href-content=".source">SOURCE</a></small></b>
					</div>
				</td>
			</tr>
			</table>
			<!-- End timeline popup -->
		</div>

		<div ex:role="coder" ex:coderClass="Color" id="event-colors">
			<span ex:color="#f00">BIBLIFO</span>
			<span ex:color="#0f0">OrlandoEvents</span>
			<span ex:color="#00f">Multimedia</span>
			<span ex:color="#ff0">LGLC</span>
		</div>

		<!-- Example for customizing icons without any data manipulations -->
		<div ex:role="coder" ex:coderClass="Icon" id="event-icons" style="display:none;">
			<span ex:icon="http://simile.mit.edu/painter/painter?renderer=map-marker&shape=circle&width=15&height=15&pinHeight=5&background=f00">BIBLIFO</span>
			<span ex:icon="http://simile.mit.edu/painter/painter?renderer=map-marker&shape=circle&width=15&height=15&pinHeight=5&background=0f0">OrlandoEvents</span>
			<span ex:icon="http://simile.mit.edu/painter/painter?renderer=map-marker&shape=circle&width=15&height=15&pinHeight=5&background=00f">Multimedia</span>
			<span ex:icon="http://simile.mit.edu/painter/painter?renderer=map-marker&shape=circle&width=15&height=15&pinHeight=5&background=ff0">LGLC</span>
		</div>

		<!-- This sychronizes the showing of popups, i.e. if a map marker is clicked, the popup on the timeline also shows -->
		<div ex:role="coordinator" id="event"></div> 

		<!-- Begin timeline component -->
		<div><a id="timelineToggle" style="font-weight: bold; color: #000; font-size: 11px; text-decoration: none;" href="#" onclick="toggleTimeline();">Hide Timeline</a></div>

		<div style="margin-top: 5px;" id="timelineArea" ex:role="view"
			ex:viewClass="Timeline"
			ex:label="Timeline"
			ex:start=".startDate"
			ex:end=".endDate"
			ex:bubbleWidth="350"
			ex:topBandPixelsPerUnit="400"
			ex:showSummary="true"
			ex:iconCoder="event-icons"
			ex:iconKey=".group"
			ex:timelineHeight="170"
			ex:selectCoordinator="bubble-coordinator">
		</div>
		<!-- End timeline component -->
			
		<div style="width: 50%;">
			<a id="mapToggle" style="font-weight: bold; color: #000; font-size: 11px; text-decoration: none;" href="#" onclick="toggleMap();">Hide Panel</a>
		</div>

		<div ex:role="viewPanel" id="mapArea">
			<!-- Begin map popup -->
			<!-- This controls a custom popup for the map markers. Disabling it causes the same popup to be used for both timeline and map -->
			<div class="map-lens" ex:role="lens" style="display: none; text-align: left; overflow: auto; width: 300px; height: 100px;">
				<table cellpadding="2" width="100%">
				<tr>
					<td width="1">
						<img ex:if-exists=".images" ex:src-content=".images" width="100px" />
					</td>
					<td width="1">
						<iframe width="150" height="150" ex:if-exists=".videos" ex:src-content=".videos" frameborder="0" allowfullscreen></iframe>
					</td>
					<td>						
					<div>
						<span ex:if-exists=".location">
							<b><small>LOCATION</small></b> <span ex:content=".location"></span><br />
						</span>
						<span ex:if-exists=".startDate">
							<b><small>DATE</small></b> 
							<span ex:content=".startDate"></span>
							<span ex:if-exists=".endDate">
							 <b><small>TO</small></b> <span ex:content=".endDate"></span>
							</span>
							<br />
						</span>
						<b><small>TITLE</small></b> <span ex:content=".longLabel"></span><br />
						<b><small>NOTES</small></b> <span ex:content=".description"></span><br />
						<b><small><a target="_blank" ex:if-exists=".urls" ex:href-content=".urls">MORE INFO</a></small></b>
						<b><small><a target="_blank" ex:if-exists=".source" ex:href-content=".source">SOURCE</a></small></b>
					</div>
					</td>
				</tr>
				</table>
			</div>
			<!-- End map popup -->
									
			<!-- Begin map control, same map can hold multiple views, only one is needed here -->
			<div ex:role="view"
				ex:viewClass="MapView"
				ex:label="Map View"
				ex:latlng=".latLng"
				ex:latlngOrder="lnglat"
				ex:latlngPairSeparator="|"
				ex:polygon=".polygon"
				ex:polyline=".polyline"
				ex:opacity="0.5"
				ex:borderWidth="4"
				ex:showSummary="false"
				ex:center="38.479394673276445, -115.361328125"
				ex:zoom="3"
				ex:colorCoder="event-colors"
				ex:colorKey=".group"
				ex:shapeWidth="20"
				ex:shapeHeight="20"
				ex:selectCoordinator="bubble-coordinator">
			</div>
			<!-- End map control -->
									
			<!-- Begin data details -->
			<div ex:role="view"
				ex:showSummary="true" 
				ex:label="List View">
			</div>
									
			<!-- Begin tabular details -->
			<div ex:role="view"
				ex:viewClass="Tabular"
				ex:showSummary="false"
				ex:label="Grid View"
				ex:columns=".longLabel, .group, .location, .startDate, .endDate"
				ex:columnLabels="Title, Collection, Location, Start, End"
				ex:sortAscending="true"
				ex:sortColumn="0"
				ex:showToolbox="true"
				ex:rowStyler="zebraStyler">
				
				<table border="0" style="display: none;">
				<tr>
					<td width="50%"><span ex:content=".longLabel"></span></td>
					<td width="10%"><span ex:content=".group"></span></td>
					<td width="10%"><span ex:content=".location"></span></td>
					<td width="10%"><span ex:content=".startDate"></span></td>
					<td width="10%"><span ex:content=".endDate"></span></td>
				</tr>
				</table>
			</div>
		</div>
	</td>
</tr>
</table>
</body>
</html>
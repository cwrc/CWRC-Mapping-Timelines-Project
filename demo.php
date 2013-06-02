<!DOCTYPE>
<?php
set_time_limit(120);

$jsondata1 = file_get_contents("json/1964.json");
$jsondata2 = file_get_contents("json/1965.json");
$jsondata3 = file_get_contents("json/nationalinternational.json");
$jsondata4 = file_get_contents("json/britishwomenwriters.json");
$jsondata5 = file_get_contents("json/writingclimate.json");
$jsondata6 = file_get_contents("json/socialclimate.json");

?>

<html>
<head>
	<title>CWRC Timeline &amp; Mapping Tool</title>

	<script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=false"></script>
    <script type="text/javascript" src="libs/timemap/lib/mxn/mxn.js?(googlev3)"></script>
    
	<script type="text/javascript" src="libs/timemap/lib/jquery-1.6.2.min.js"></script>
	<script type="text/javascript" src="libs/timemap/lib/timeline-2.3.0.js"></script>
	<script type="text/javascript" src="libs/timemap/src/timemap.js"></script>
	<script type="text/javascript" src="libs/timemap/src/manipulation.js"></script>
	<script type="text/javascript" src="libs/timemap/src/param.js"></script>
	
	<script src="zoombar/timeline_zoom_overrides.js" type="text/javascript"></script>
	<script src="zoombar/TimelineBandZoomBar.js" type="text/javascript"></script>
	<script src="zoombar/TimelineBandPanControl.js" type="text/javascript"></script>

	<link rel="stylesheet" href="zoombar/timemaps.css" type="text/css">
	<link rel="stylesheet" href="zoombar/TimelineBandZoomBar.css" type="text/css">
	<link rel="stylesheet" href="zoombar/TimelineBandPanControl.css" type="text/css">
	
	<script src="zoombar/timemap_overrides.js" type="text/javascript"></script>
	<style type="text/css">
    div#timelinecontainer {
		height: 200px; 
		border: 1px solid #999;
	}
	#timeline {
		overflow-x:hidden; 
		overflow-y:scroll;
		height: 100%;
		background: #eee;
	}
    div#mapcontainer {
		height: 450px;
		border: 1px solid #999;
	}
	div.infodescription {
		height: 10px;
	}
    div.olFramedCloudPopupContent {
		width: 200px;
	}
	#legend {
		font-size: 10px;
		text-align: center;
	}
	.toggle {
		margin: 5px;
		text-decoration: none;
		font-size: 10pt;
		background: #CCC;
		color: #FFF;
		border: 1px solid #555;
	}
	</style>

	<script type="text/javascript">
	var tm;

	$(function () {
		var dateNow = new Date();
		var startDate = new Date('January 01, 1620 00:00:00 GMT+0100');
		var endDate = new Date();

		if (dateNow.getTime() < endDate.getTime()) {
			while (dateNow.getTime() > startDate.getTime()) {
				var startDateInMilli = startDate.getTime();
				startDateInMilli = startDateInMilli + (24 * 60 * 60 * 1000);
				startDate.setTime(startDateInMilli);
			}
		}

		var activitiesLoaded = false;

		var theme1 = Timeline.ClassicTheme.create();
		theme1.autoWidth = false;
		theme1.timeline_start = new Date(Date.UTC(1600, 1, 1));
		theme1.timeline_stop = new Date();
		theme1.mouseWheel = 'scroll';
		theme1.event.track.offset = 25;
		
		var d = startDate.toGMTString(),
			greatestMag = {
				pixelsPerInterval: 250,
				unit: Timeline.DateTime.CENTURY
			},
			leastMag = {
				pixelsPerInterval: 50,
				unit: Timeline.DateTime.DECADE
			},
			theZoomSteps = initZoomSteps(12, greatestMag, leastMag),
			theZoomIndex = 3,
			theIntervalUnit = theZoomSteps[theZoomIndex].unit,
			theIntervalPixels = theZoomSteps[theZoomIndex].pixelsPerInterval,
			theMapZoom = 3,
			lon = -113.466797,
			lat = 53.480691 ,
			theMapCenter = new mxn.LatLonPoint();

		theMapCenter.lon = lon;
		theMapCenter.lat = lat;
		theMapCenter.lng = lon;

		tm = TimeMap.init({
			mapId: "map",
			timelineId: "timeline",
			scrollTo: d,
			options: {
				eventIconPath: "libs/timemap/images/",
				centerOnItems: false,
				mapCenter: theMapCenter,
				mapZoom: theMapZoom
			},
			datasets: [
			{
				id: "1964",
				title: "1964",
				theme: new TimeMapTheme({
					eventIconImage: "orange-circle.png",
					icon: "libs/timemap/images/orange-circle.png",
					iconSize: [16,16],
					eventColor: "#FF9900"
				}),
				type: "basic",
				options: { 
					items: [<?php echo $jsondata1; ?>]
				}
			},
			{
				id: "1965",
				title: "1965",
				theme: new TimeMapTheme({
					eventIconImage: "green-circle.png",
					icon: "libs/timemap/images/green-circle.png",
					iconSize: [16,16],
					eventColor: "#00E64D"
				}),
				type: "basic",
				options: { 
					items: [<?php echo $jsondata2; ?>]
				}
			},
			{
				id: "NATIONALINTERNATIONAL",
				title: "National and International",
				theme: new TimeMapTheme({
					eventIconImage: "earth1.png",
					icon: "libs/timemap/images/earth1.png",
					iconSize: [16,16],
					eventColor: "#4E5F91"
				}),
				type: "basic",
				options: { 
					items: [<?php echo $jsondata3; ?>]
				}
			},
			{
				id: "BRITISHWOMENWRITERS",
				title: "British Women Writers",
				theme: new TimeMapTheme({
					eventIconImage: "pen1.png",
					icon: "libs/timemap/images/pen1.png",
					iconSize: [16,16],
					eventColor: "#B2CCFF"
				}),
				type: "basic",
				options: { 
					items: [<?php echo $jsondata4; ?>]
				}
			},
			{
				id: "WRITINGCLIMATE",
				title: "Writing Climate",
				theme: new TimeMapTheme({
					eventIconImage: "book1.png",
					icon: "libs/timemap/images/book1.png",
					iconSize: [16,16],
					eventColor: "#8C11C4"
				}),
				type: "basic",
				options: { 
					items: [<?php echo $jsondata5; ?>]
				}
			},
			{
				id: "SOCIALCLIMATE",
				title: "Social Climate",
				theme: new TimeMapTheme({
					eventIconImage: "people1.png",
					icon: "libs/timemap/images/people1.png",
					iconSize: [16,16],
					eventColor: "#6A6FD1"
				}),
				type: "basic",
				options: { 
					items: [<?php echo $jsondata6; ?>]
				}
			},
			<?php if (!isset($_REQUEST['historical'])) { ?>
			{
				id: "OVERLAY",
				title: "Historical Map",
				theme: new TimeMapTheme({
					eventIconImage: "people1.png",
					icon: "libs/timemap/images/people1.png",
					iconSize: [16,16],
					eventColor: "#6A6FD1"
				}),
				type: "basic",
				options: { 
					items: [
						{
              start : "1849",
              overlay : {
                  north: 70.327858, // Latutude of topmost coordinate
                  south: 44.69096, // Latutude of bottommost coordinate
                  east: -36.25, // Longitude of rightmost coordinate
                  west: -146.816406, // Longitude of leftmost coordinate
                  image: "img/1849_canada.png"
              },
              title : "Historical map",
              options : {
                  description: "Historical map"
              }
          }
					]
				}
			}
			<?php } ?>
			],
			bandInfo: [{
				width: "100%",
				intervalUnit: theIntervalUnit,
				align: "Top",
				intervalPixels: theIntervalPixels,
				date: d,
				theme: theme1,
				layout: 'original', // original, overview, detailed
				zoomIndex: theZoomIndex,
				zoomSteps: theZoomSteps
			}]
		});

		var talkDataset = tm.datasets.ds0,
			filmDataset = tm.datasets.ds1,
			activityDataset = tm.datasets.ds2,
			showDataset = tm.datasets.ds3,
			tourDataset = tm.datasets.ds4,
			workshopDataset = tm.datasets.ds5;

		tm.timeline.layout();

		var coordinate = function (item) {
			var bounds = item.map.getBounds();
			return bounds.contains(item.getInfoPoint());
		};
		
		var hasSelectedTag = function(item) {
			return !window.selectedTag || (
				item.opts.tags && 
				item.opts.tags.indexOf(window.selectedTag) >= 0
			);
		};
		
		tm.addFilter("map", hasSelectedTag);
		tm.addFilter("timeline", hasSelectedTag);			
		tm.addFilter("timeline", coordinate);
		
		tm.map.addEventListener("moveend", function () {
			tm.filter("timeline");
		});

		var theTimeline = tm.timeline,
			theBandNo = 0,
			tlZoomBar = new TimelineBandZoomBar(theTimeline, theBandNo),
			tlPanControl = new TimelineBandPanControl(theTimeline, theBandNo);

		theTimeline.ZoomBar = tlZoomBar;
		theTimeline.PanControl = tlPanControl;
		
		$('#project_select').change(function() {
			window.selectedTag = $(this).val();
			tm.filter('map');
			tm.filter('timeline');
			$("#event_select").val("");
			if (window.selectedTag == 'lglc') {
				$('input[name=1964]').attr('disabled', false);
				$('input[name=1965]').attr('disabled', false);
				
				$('input[name=1964]').attr('checked', true);
				$('input[name=1965]').attr('checked', true);
				
				$('input[name=ni]').attr('disabled', true);
				$('input[name=bww]').attr('disabled', true);
				$('input[name=wc]').attr('disabled', true);
				$('input[name=sc]').attr('disabled', true);
			} else if (window.selectedTag == 'orlando') {
				$('input[name=ni]').attr('disabled', false);
				$('input[name=bww]').attr('disabled', false);
				$('input[name=wc]').attr('disabled', false);
				$('input[name=sc]').attr('disabled', false);

				$('input[name=ni]').attr('checked', true);
				$('input[name=bww]').attr('checked', true);
				$('input[name=wc]').attr('checked', true);
				$('input[name=sc]').attr('checked', true);

				$('input[name=1964]').attr('disabled', true);
				$('input[name=1965]').attr('disabled', true);
			} else {
				$('input[name=1964]').attr('checked', true);
				$('input[name=1965]').attr('checked', true);
				
				$('input[name=ni]').attr('checked', true);
				$('input[name=bww]').attr('checked', true);
				$('input[name=wc]').attr('checked', true);
				$('input[name=sc]').attr('checked', true);

				$('input[name=ni]').attr('disabled', false);
				$('input[name=bww]').attr('disabled', false);
				$('input[name=wc]').attr('disabled', false);
				$('input[name=sc]').attr('disabled', false);

				$('input[name=1964]').attr('disabled', false);
				$('input[name=1965]').attr('disabled', false);
			}
		});
		
		
    $('#event_select').change(function() {
      window.selectedTag = $(this).val();
      tm.filter('map');
      tm.filter('timeline');
      $("#project_select").val("");
    });
	});
		
	function toggleDataset(dsid, toggle) {
		if (toggle) {
			tm.datasets[dsid].show();
		} else {
			tm.datasets[dsid].hide();
		}
	}
	</script>
</head>

<body>
<div id="timemap">
	<a class="toggle" href="#" onclick="$('#mapcontainer').toggle();">Toggle Map</a> 
	<a class="toggle" href="#" onclick="$('#timelinecontainer').toggle();">Toggle Timeline</a>
	<?php if (!isset($_REQUEST['historical'])) {?>
    <a class="toggle" href="?historical=off">Toggle Hist. Maps</a>
	<?php } else { ?>
    <a class="toggle" href="demo.php?">Toggle Hist. Maps</a>
	<?php } ?>
	
	<p>
	<b>Facets: </b>
	<small>Project type:</small><select id="project_select">
		<option value="">All projects</option>
		<option value="orlando">Orlando</option>
		<option value="lglc">LGLC</option>
	</select>
    
	<small>Event type:</small><select id="event_select">
		<option value="">All events</option>
		<option value="literary">Literary</option>
		<option value="bibliographical">Bibliographical</option>
		<option value="biographical">Biographical</option>
		<option value="cultural">Cultural</option>
		<option value="social">Social</option>
		<option value="political">Political</option>
	</select>
  </p>
	
	
	<table id="legend">
	<tr>
		<td><b>KEY</b></td>
		<td><img src="libs/timemap/images/orange-circle.png" /><br /><input type="checkbox" name="1964" onclick="toggleDataset('1964', this.checked);" checked/></td>
		<td>LGLC 1964</td>

		<td><img src="libs/timemap/images/green-circle.png" /><br /><input type="checkbox" name="1965" onclick="toggleDataset('1965', this.checked);" checked/></td>
		<td>LGLC 1965</td>
		
		<td><img src="libs/timemap/images/earth1.png" /><br /><input type="checkbox" name="ni" onclick="toggleDataset('NATIONALINTERNATIONAL', this.checked);" checked/></td>
		<td>Orlando National International</td>
		
		<td><img src="libs/timemap/images/pen1.png" /><br /><input type="checkbox" name="bww" onclick="toggleDataset('BRITISHWOMENWRITERS', this.checked);" checked/></td>
		<td>Orlando British Women Writers</td>
		
		<td><img src="libs/timemap/images/book1.png" /><br /><input type="checkbox" name="wc" onclick="toggleDataset('WRITINGCLIMATE', this.checked);" checked/></td>
		<td>Orlando Writing Climate</td>
		
		<td><img src="libs/timemap/images/people1.png" /><br /><input type="checkbox" name="sc" onclick="toggleDataset('SOCIALCLIMATE', this.checked);" checked/></td>
		<td>Orlando Social Climate</td>
	</tr>
	</table>

  <div id="timelinecontainer">
		<div id="timeline" class="timeline"></div>
	</div>
	<div id="mapcontainer">
		<div id="map" class="map"></div>
	</div>	
</div>

</body>
</html>

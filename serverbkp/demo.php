<!DOCTYPE html>
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
    <title>CWRC</title>
    
    <script type="text/javascript" src="libs/openlayers/OpenLayers.js"></script>
    <script type="text/javascript" src="libs/timemap/lib/jquery-1.6.2.min.js"></script>
    <script type="text/javascript" src="libs/timemap/lib/mxn/mxn.js?(openlayers)"></script>
    <script type="text/javascript" src="libs/timemap/lib/timeline-1.2.js"></script>
    <script type="text/javascript" src="libs/timemap/src/timemap.js"></script>
    <script type="text/javascript" src="libs/timemap/src/manipulation.js" ></script>
    
    <style type="text/css">
    div#timelinecontainer {
		height: 250px; 
		border: 1px solid #999;
	}
    div#mapcontainer {
		height: 450px;
		border: 1px solid #999;
	}
	div.infodescription {
		height: 10px;
	}
    div.olFramedCloudPopupContent {
		width: 100px;
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
	$(function() {
		tm = TimeMap.init({
			mapId: "map",
			timelineId: "timeline",
			options: {
				mapType: "normal",
				eventIconPath: "libs/timemap/images/",
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
				}
            ],
			bandInfo: [
				{
				   width:          "80%", 
				   intervalUnit:   Timeline.DateTime.YEAR,
				   intervalPixels: 40,
				   trackHeight:	   1.3
				},
				{
				   width:          "20%", 
				   intervalUnit:   Timeline.DateTime.CENTURY, 
				   intervalPixels: 50,
				   showEventText:  false,
				   trackHeight:    0.2,
				   trackGap:       0.2
				}
			]
		});
		
		var hasSelectedTag = function(item) {
			return !window.selectedTag || (
				item.opts.tags && 
				item.opts.tags.indexOf(window.selectedTag) >= 0
			);
		};
		
		tm.addFilter("map", hasSelectedTag);
		tm.addFilter("timeline", hasSelectedTag);
		
		$('#tag_select').change(function() {
			window.selectedTag = $(this).val();
			tm.filter('map');
			tm.filter('timeline');
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
			tm.timeline.magnify(10);
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
    <link href="libs/timemap/examples/examples.css" type="text/css" rel="stylesheet"/>
</head>

<body>
<div id="timemap">
	<a class="toggle" href="#" onclick="$('#mapcontainer').toggle();">Toggle Map</a> 
	<a class="toggle" href="#" onclick="$('#timelinecontainer').toggle();">Toggle Timeline</a>
	<select id="tag_select">
		<option value="">All projects</option>
		<option value="orlando">Orlando</option>
		<option value="lglc">LGLC</option>
	</select>
    
	<div id="timelinecontainer">
	  <div id="timeline"></div>
	</div>
	<div id="mapcontainer">
	  <div id="map"></div>
	</div>

	<form method="post" action="demo.php">
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
	</form>
</div>
</body>
</html>

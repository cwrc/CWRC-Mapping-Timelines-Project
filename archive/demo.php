<!DOCTYPE html>
<?php
set_time_limit(120);

$jsondata1 = file_get_contents("json/1964.json");
$jsondata2 = file_get_contents("json/1965.json");
$jsondata3 = file_get_contents("json/nationalinternational.json");
$jsondata4 = file_get_contents("json/britishwomenwriters.json");
$jsondata5 = file_get_contents("json/writingclimate.json");
$jsondata6 = file_get_contents("json/socialclimate.json");

$chk1964 = "checked";
$chk1965 = "checked";
$chkni= "checked";
$chkbww = "checked";
$chkwc = "checked";
$chksc = "checked";

if (isset($_POST['filterOn'])) {
	if (!isset($_POST['1964'])) {
		$jsondata1 = "";
		$chk1964 = "";
	}
	if (!isset($_POST['1965'])) {
		$jsondata2 = "";
		$chk1965 = "";
	}
	if (!isset($_POST['ni'])) {
		$jsondata3 = "";
		$chkni = "";
	}
	if (!isset($_POST['bww'])) {
		$jsondata4 = "";
		$chkbww = "";
	}
	if (!isset($_POST['wc'])) {
		$jsondata5 = "";
		$chkwc = "";
	}
	if (!isset($_POST['sc'])) {
		$jsondata6 = "";
		$chksc = "";
	}
}

?>
<html>
<head>
    <title>CWRC</title>
    
    <script type="text/javascript" src="libs/openlayers/lib/OpenLayers.js"></script>
    <script type="text/javascript" src="libs/timemap/lib/jquery-1.6.2.min.js"></script>
    <script type="text/javascript" src="libs/timemap/lib/mxn/mxn.js?(openlayers)"></script>
    <script type="text/javascript" src="libs/timemap/lib/timeline-1.2.js"></script>
    <script type="text/javascript" src="libs/timemap/src/timemap.js"></script>
    <script type="text/javascript" src="libs/timemap/timemap_full.pack.js"></script>
    
    <script src="libs/timemap/src/param.js" type="text/javascript"></script>
    <script src="libs/timemap/src/loaders/xml.js" type="text/javascript"></script>
    <script src="libs/timemap/src/loaders/georss.js" type="text/javascript"></script>
    
    <script type="text/javascript">
    var tm;
	$(function() {
		tm = TimeMap.init({
			mapId: "map",
			timelineId: "timeline",
			options: {
				eventIconPath: "libs/timemap/images/"
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
	});
    </script>
    
    <link href="libs/timemap/examples/examples.css" type="text/css" rel="stylesheet"/>
    
    <style type="text/css">
    div#timelinecontainer {
		height: 150px; 
		border: 1px solid #999;
	}
    div#mapcontainer {
		height: 350px;
		border: 1px solid #999;
	}
	div.infodescription {
		height: 10px;
	}
    div.olFramedCloudPopupContent {
		width: 300px;
	}
	#legend {
		font-size: 10px;
		text-align: center;
	}
	</style>
</head>

<body>
<div id="timemap">
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
		<td><img src="libs/timemap/images/orange-circle.png" /><br /><input type="checkbox" name="1964" <?php echo $chk1964; ?> /></td>
		<td>LGLC 1964</td>
		<td><img src="libs/timemap/images/green-circle.png" /><br /><input type="checkbox" name="1965" <?php echo $chk1965; ?> /></td>
		<td>LGLC 1965</td>
		<td><img src="libs/timemap/images/earth1.png" /><br /><input type="checkbox" name="ni" <?php echo $chkni; ?> /></td>
		<td>Orlando National International</td>
		<td><img src="libs/timemap/images/pen1.png" /><br /><input type="checkbox" name="bww" <?php echo $chkbww; ?> /></td>
		<td>Orlando British Women Writers</td>
		<td><img src="libs/timemap/images/book1.png" /><br /><input type="checkbox" name="wc" <?php echo $chkwc; ?> /></td>
		<td>Orlando Writing Climate</td>
		<td><img src="libs/timemap/images/people1.png" /><br /><input type="checkbox" name="sc" <?php echo $chksc; ?> /></td>
		<td>Orlando Social Climate</td>
		<td><input type="submit" name="filterOn" value="Filter" /></td>
	</tr>
	</table>
	</form>
</div>
</body>
</html>

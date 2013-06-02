<?php
set_time_limit(120);

$file = file_get_contents('xml/orlando_canadian_events_2013-03-22.xml');
$file = str_replace('xmlns=', 'ns=', $file);
$xml = new SimpleXMLElement($file);

//$elements = $xml->xpath('/ORLANDO/FREESTANDING_EVENT');

function getElements($xml){
	$tags = $_REQUEST['tags'];
	$limit = false;
	if (isset($_REQUEST['max'])) {
		$sizelim = $_REQUEST['max'];
		$limit = true;
	}

	$elements = $xml->xpath('/ORLANDO/FREESTANDING_EVENT');
	$more_elements = $xml->xpath('/ORLANDO/HOSTED_EVENT');
	$elements = array_merge($elements, $more_elements);

	$i = 0;
	while (list( ,$node) = each($elements)){
	   if (isset($_REQUEST['CHRONCOLUMN'])) {
			if (getCategory($node) != $_REQUEST['CHRONCOLUMN']) continue;
	   }
 
	   	if ($limit == true && $i >= $sizelim) break;
		$i++;
		print "{ \n";
	   
	   $start = getStart($node);
	   print "\t\"start\" : \"$start\",\n";

	   $end = getEnd($node);
	   if ($end !== ""){
		   print "\t\"end\" : \"$end\",\n";
	   }

	   $point = getPoint($node);
	   $geoxml = getGeoXML($point);
	   $lat = getLat($geoxml);
	   $lon = getLon($geoxml);
	   
	   print "\t\"point\" : ";
	   print "\n\t{";
	   print "\n\t\t\"lat\" : $lat,";
	   print "\n\t\t\"lon\" : $lon";
	   print "\n\t},\n";

	   $title = getTitle($node);
	   
	   print "\t\"title\" : \"$title($start)\",\n";

	   //print "\t\"title\" : \"$title\",\n";
	   
	   $options = getOptions($node);
	   print "\t\"options\" : ";
	   print "\n\t{";
	   print "\n\t\t\"infoHtml\" : \"<div style='font-size: 8pt; word-wrap:break-word;'>";
	   print "<p><strong>$title</strong></p>";
	   $dates = $start;
		if ($end != "") $dates += " to ".$end;
		print "<p>Dates: $dates</p>";

	   $media = $node->xpath('media/url');
	   $imgs = @$media[0];
	   if (isset($imgs)) print "<img src='$imgs' style='padding: 5px; float: left; width: 75px;'>";
	   $imgs = @$media[1];
	   if (isset($imgs)) print "<img src='$imgs' style='padding: 5px; float: left; width: 75px;'>";
	   
	   print $options;
	   print "</div>\",";
	   print "\n\t\t\"tags\" : [$tags]";
	   print "\n\t}\n";
	 
	   print "},\n"; 
	}
}


function getStart($node){
#orlando/FREESTANDING/CHRONSTRUCT/DATE/@VALUE
#orlando/FREESTANDING/CHRONSTRUCT/DATERANGE/@FROM
#orlando/FREESTANDING/CHRONSTRUCT/DATESTRUCT/@VALUE

   $date = $node->xpath('CHRONSTRUCT/DATE');
   $d = @$date[0];
   
   if (isset($d['VALUE'])){
       return $d['VALUE'];
   }else{
       $date = $node->xpath('CHRONSTRUCT/DATERANGE');
       $d = @$date[0];
       if (isset($d['FROM'])){
          return $d['FROM'];
       }else{
          $date = $node->xpath('CHRONSTRUCT/DATESTRUCT');
          $d = $date[0];
          if (isset($d['VALUE'])){
             return $d['VALUE'];
          }
       }
       return "";
   }

}

function getEnd($node){
#orlando/FREESTANDING/CHRONSTRUCT/DATERANGE/@TO
   $date = $node->xpath('CHRONSTRUCT/DATERANGE');
   $d = @$date[0];

   if (isset($d['TO'])){
       return $d['TO'];
   }else{
     return "";
   }
}

function getPoint($node){
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/PLACENAME
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/SETTLEMENT
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/SETTLEMENT/@REG
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/REGION
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/REGION/@REG
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/GEOG
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/GEOG/@REG
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/ADDRESS/ADDRLINE   
   $point = $node->xpath('CHRONSTRUCT/CHRONPROSE/PLACE/PLACENAME');
   $p = @$point[0];
   if (isset($p)){
     $p = preg_replace("/\s+/", " ", $p);
     return $p;
   }else{
     $point = $node->xpath('CHRONSTRUCT/CHRONPROSE/PLACE/SETTLEMENT');
     $p = @$point[0];
     if (isset($p)){
		$p = preg_replace("/\s+/", " ", $p);
        return $p;
     }else{
		$point = $node->xpath('CHRONSTRUCT/CHRONPROSE/PLACE/REGION');
		$p = @$point[0];
		if (isset($p)){
		   $p = preg_replace("/\s+/", " ", $p);
                   return $p;
		}
		else{
		  $point = $node->xpath('CHRONSTRUCT/CHRONPROSE/PLACE/GEOG');
		  $p = @$point[0];
		  if (isset($p)){
		   $p = preg_replace("/\s+/", " ", $p);
		   return $p;
		  }
		  else{
			 $point = $node->xpath('CHRONSTRUCT/CHRONPROSE/PLACE/ADDRESS/ADDRLINE');
			 $p = @$point[0];
			 if (isset($p)){
				$p = preg_replace("/\s+/", " ", $p);
			   return $p;
			 }else{
			   return "";
			  }           
		  }
		}
     }
    }
}                 

function getGeoXML($point) {
   $point = urlencode($point);
   $file = file_get_contents("http://maps.googleapis.com/maps/api/geocode/xml?address=$point&sensor=false");
   $file = str_replace('xmlns=', 'ns=', $file);
   $xml = new SimpleXMLElement($file);
   return $xml;
}

function getLat($geoxml) {
	$lat = $geoxml->xpath('/GeocodeResponse/result/geometry/location/lat');
	$l = @$lat[0];
    if (isset($l)){
       $l = preg_replace("/\s+/", " ", $l); 
       return $l;
    }else{
	   return -82.8627519; // Antartica
	}
}

function getLon($geoxml) {
	$lng = $geoxml->xpath('/GeocodeResponse/result/geometry/location/lng');
	$l = @$lng[0];
    if (isset($l)){
       $l = preg_replace("/\s+/", " ", $l); 
       return $l;
    }else{
	   return -135.0000000; // Antartica
	}
}

function getTitle($node){
#orlando/FREESTANDING/CHRONSTRUCT/CHRONPROSE

    $title = $node->xpath('CHRONSTRUCT/CHRONPROSE');
    $t = $title[0];
    $chrText = $t->asXML();
    preg_match_all('@<CHRONPROSE.*?>(.+)</CHRONPROSE>@is', $chrText, $matches,PREG_SET_ORDER);

    $titleText = $matches[0][1];
    $titleText = preg_replace('@<.+?>@is',"",$titleText);
    $titleText = preg_replace('@</.+?>@is',"",$titleText);
 
    $titleText = preg_replace("/\s+/", " ", $titleText);
    return $titleText; 
}



function getOptions($node){
#orlando/FREESTANDING/SHORTPROSE

  $n = @$node[0]; 
  $shrText = $n->asXML();
  preg_match_all('@<SHORTPROSE.*?>(.+)</SHORTPROSE>@is', $shrText, $matches,PREG_SET_ORDER);

  $opText = @$matches[0][1];
  $opText = preg_replace('@<.+?>@is',"",$opText);
  $opText = preg_replace('@</.+?>@is',"",$opText);
 
  $opText = preg_replace("/\s+/", " ", $opText); 
  return $opText;

}

function getCategory($node){
#orlando/FREESTANDING/CHRONSTRUCT/@CHRONCOLUMN
   
   $category = $node->xpath('CHRONSTRUCT');
   $category = $category[0];
   if (isset($category['CHRONCOLUMN'])){
       return $category['CHRONCOLUMN'];
   }else{
       return "";
   }
}

getElements($xml);
?>

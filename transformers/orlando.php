<?php
/**
 * Orlando XML data parser
 * @author Hamman Samuel
 */

set_time_limit(3600);

include('Transformer.php');
include('Element.php');

$path = "orlando/";
processFiles($path);

function getElements($xml){
	$elements = $xml->xpath('/ORLANDO/FREESTANDING_EVENT');
	$more_elements = $xml->xpath('/ORLANDO/HOSTED_EVENT');
	$elements = array_merge($elements, $more_elements);

	$index = 0;
	while (list( ,$node) = each($elements)){
		$index++;

		$el = new Element();
		$el->group = "ORLANDO";
		
		$chroncol = strtoupper(getCategory($node));
		$el->subGroup = $chroncol;
		$el->eventType = "Publication";

		$title = htmlentities(getTitle($node));
		$showtitle = neatTrim($title, 40). "[$index]";
        $el->label = $showtitle;
        $el->longLabel = $title;

		$start = cleanDate(getStart($node));
        $el->startDate = $start;

		$end = cleanDate(getEnd($node));
		if ($end !== "") $el->endDate = $end;
		
		$dateType = getDateGrain($start, $end);
		$el->dateType = $dateType;

		$locstr = "";
		$latlngstr = "";
		$locgrainstr = "";
		
		$points = getPoints($node);
		if (count($points) > 1) $pointtypestr = "Multi-Point";
        else if (count($points) == 1) $pointtypestr = "Point";
        else $pointtypestr = "N/A";
		$el->pointType = $pointtypestr;

		foreach($points as $point) {
			if (trim($point) == "") continue;
            $geoxml = getGeoXML($point, "GB");
            
            if ($geoxml->totalResultsCount == 0) $geoxml = getGeoXML($point);
            
            $ctry = getCountry($geoxml);
            if ($ctry != "") $locstr .= "\"".htmlentities($point).", $ctry\",";
            else $locstr .= "\"".htmlentities($point)."\",";
        
            $lat = getLat($geoxml);
            $lon = getLon($geoxml);
            
            if ($lon != "" && $lat != "") $latlngstr .= "\"$lat,$lon\",";
            
            $locgrain = getLocationGrain($geoxml);
            if ($locgrain != "") $locgrainstr .= "\"$locgrain\",";
            else $locgrainstr .= "\"N/A\",";
		}
		
		$locstr = substr($locstr, 0, -1);
		$latlngstr = substr($latlngstr, 0, -1);
		$locgrainstr = substr($locgrainstr, 0, -1);
		
		$el->location = "[$locstr]";
		$el->latLng = "[$latlngstr]";
		$el->locationType = "[$locgrainstr]";

		$options = htmlentities(getOptions($node));
		$el->description = $options;
        printElement($el, true);
	}
}


function getStart($node){
	$date = $node->xpath('CHRONSTRUCT/DATE');
	$d = @$date[0];
   
	if (isset($d['VALUE'])){
		return $d['VALUE'];
	} else {
		$date = $node->xpath('CHRONSTRUCT/DATERANGE');
		$d = @$date[0];
		if (isset($d['FROM'])){
			return $d['FROM'];
		} else {
			$date = $node->xpath('CHRONSTRUCT/DATESTRUCT');
			$d = $date[0];
			if (isset($d['VALUE'])) return $d['VALUE'];
		}
		return "";
	}
}

function getEnd($node){
	$date = $node->xpath('CHRONSTRUCT/DATERANGE');
	$d = @$date[0];

	if (isset($d['TO'])) return $d['TO'];
	else return "";
}

function cleanDate($date) {
	if (preg_match("/^\d{4}--$/", $date) == 1) return substr($date, 0, -2);
	if (preg_match("/^\d{4}-\d{2}-$/", $date) == 1) return substr($date, 0, -1);
	return $date;
}

function getPoints($node){
	$places = $node->xpath('CHRONSTRUCT/CHRONPROSE/PLACE');
	if ($places == null) $places = $node->xpath('CHRONSTRUCT/CHRONPROSE/BIRTHPOSITION/PLACE');
	
	$points = array();
	$i = 0;
	foreach($places as $place) {
		$city = "";
		$region = "";
		$country = "";
		
		if (isset($place->SETTLEMENT)) $city = $place->SETTLEMENT;
		if (isset($place->REGION)) $region = $place->REGION;
		if (isset($place->GEOG)) $country = $place->GEOG;
	
		$ret = "";
		if ($city != "" && $region == "" && $country == "") $ret = $city;
		if ($city == "" && $region != "" && $country == "") $ret = $region;
		if ($city == "" && $region == "" && $country != "") $ret = $country;
		if ($city != "" && $region != "" && $country == "") $ret = "$city, $region";
		if ($city != "" && $region == "" && $country != "") $ret = "$city, $country";
		if ($city == "" && $region != "" && $country != "") $ret = "$region, $country";
		
		$points[$i] = $ret;
		$i++;
	}
	return $points;
}

function getTitle($node){
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
	$category = $node->xpath('CHRONSTRUCT');
	$category = $category[0];
	if (isset($category['CHRONCOLUMN'])) {
	   return $category['CHRONCOLUMN'];
	} else {
	   return "";
	}
}

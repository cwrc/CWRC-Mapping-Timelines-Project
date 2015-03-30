<?php
/**
 * LGLC XML data parser
 * @author Hamman Samuel
 */

set_time_limit(3600);

include('Transformer.php');
include('Element.php');

$index = 0;
$path = "lglc/";
processFiles($path);
//$testfile = "1964.xml";
//processFile($path, $testfile);

function getElements($xml){
	global $index;
	$elements = $xml->xpath('/TEI/text/body/div');
	
	while (list( ,$node) = each($elements)){
		$index++;
		$el = new Element();
		$el->group = "LGLC";
		$el->subGroup = "N/A";
		$el->eventType = "Publication";
        
		$start = getStart($node);
		$el->startDate = $start;
		
		$end = getEnd($node);
		if ($end != "") $el->endDate = $end;
		
		$dateType = getDateGrain($start, $end);
        $el->dateType = $dateType;

		$title = htmlentities(getTitle($node));
		$showtitle = neatTrim($title, 40)." [$index]";
        $el->label = $showtitle;
        $el->longLabel = $title;

		$point = getPoint($node);
		$location = htmlentities($point);
        $locgrain = "N/A";
		$pointtype = "N/A";

		if (trim($point) != "") {
            $geoxml = getGeoXML($point, "CA");
            
            if ($geoxml->totalResultsCount == 0) $geoxml = getGeoXML($point);

            $ctry = getCountry($geoxml);
            if ($ctry != "") $location .= ", ".$ctry;

            $el->location = $location;
			$lat = getLat($geoxml);
            $lon = getLon($geoxml);
            
			if ($lon != "" && $lat != "") $el->latLng = "$lat,$lon";
            $pointtype = "Point";
            $locgrain = getLocationGrain($geoxml);
        }
        
        $el->locationType = $locgrain;
        $el->pointType = $pointtype;

        $options = htmlentities(getOptions($node));
        $el->description = $options;
		printElement($el);
	}
}

function getStart($node){
	$date = $node->xpath('p/date');
	$d = $date[0];
	if (isset($d['from'])) $ret = $d['from'];
	else $ret = $d['when'];
	return $ret;
}

function getEnd($node){
	$date = $node->xpath('p/date');
	$d = $date[0];

	if (isset($d['to'])) return formatDate($d['to']);
	else return "";
}

function getPoint($node){
   $point = $node->xpath('p/placeName');
   $p = @$point[0];
   if (isset($p)){
	   $p = preg_replace("/\s+/", "", $p);
       return $p;
   }else{
     return "";
   }
}

function getTitle($node){
    $title = $node->xpath('p/title');
    $t = "";
    $t = @$title[0];
    if (isset($t)){
		$t = preg_replace("/\s+/", " ", $t); 
    } else {
		$title = $node->xpath('note/bibl/title');   
		$t = @$title[0];
		if (isset($t)) { 
         $t = preg_replace("/\s+/", " ", $t); 
		} else {
			$title = $node->xpath('p/orgName');
			$t = $title[0];
			if (isset($t)) {
				$t = preg_replace("/\s+/", " ", $t); 
			} else {
				$title = $node->xpath('note/bibl/orgName');
				$t = $title[0];
				if (isset($t)){
					$t = preg_replace("/\s+/", " ", $t); 
				}else{
					$title = $node->xpath('p');
					$t = $title[0];
					$text = $t->asXML();
					$text = preg_replace("/\s+/", " ", $text); 
					$pos = strpos($text,"</placeName>");
					if ($pos === false) {
					} else {
						$t = substr($text, $pos+12, 50);
					}
				}
			}
		}
	}
	return $t;
}

function getOptions($node){
	$divText = $node->asXML();
	preg_match_all('@<div.*?>(.+)<note>@is', $divText, $matches,PREG_SET_ORDER);

	$opText = $matches[0][1];
	$opText = preg_replace('@<.+?>@is',"",$opText);
	$opText = preg_replace('@</.+?>@is',"",$opText);

	$opText = preg_replace("/\s+/", " ", $opText); 
	return $opText;
}

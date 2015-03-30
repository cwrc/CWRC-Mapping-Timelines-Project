<?php
/**
 * Biblifo XML data parser
 * @author Hamman Samuel
 */

set_time_limit(3600);

include('Transformer.php');
include('Element.php');

$index = 0;
$path = "biblifo/";
processFiles($path);
//$testfile = "biblifo000014.xml";
//processFile($path, $testfile);

function getElements($xml){
	global $index;
	$elements = $xml->xpath('/mods');
	
	while (list( ,$node) = each($elements)){
		$type = getMonoType($node);
		if ($type == "" || $type == "Periodical") continue;
        $index++;
	   
		$el = new Element();
		$el->group = "BIBLIFO";
		$el->subGroup = $type;
		$el->eventType = "Bibliography";
        
        $title = htmlentities(getTitle($node, $type));
		$showtitle = neatTrim($title, 40)." [$index]";
        $el->label = $showtitle;
        $el->longLabel = $title;

		$start = getStart($node, $type);
		$el->startDate = $start;
		
		$dateType = getDateGrain($start, $start);
		$el->dateType = $dateType;
		
		$point = getPoint($node, $type);
		$location = htmlentities($point);
		$locgrain = "N/A";
		$pointtype = "N/A";
		
		if (trim($point) != "") {
            $geoxml = getGeoXML($point, "CA");

			if ($geoxml->totalResultsCount > 0) $geoxml = getGeoXML($point);
            
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
           
        $author = htmlentities(getAuthor($node, $type));
        $publisher = htmlentities(getPublisher($node, $type));
        
        if ($author != "") $author .= ".";
        if ($publisher != "") $publisher .= ".";
        if ($location != "") {
            if ($start != "") $location .= ":";
            else $location .= ".";
        }
        $el->description = "$author <i>$title</i>. $publisher $location $start";
        printElement($el);
	}
}

function getMonoType($node) {
	$type = $node->xpath('originInfo/issuance');
	$t = @$type[0];
	if (isset($t)){
		if ($t == "monographic") return "Monograph Whole";
	} else {
		$type = $node->xpath('relatedItem/originInfo/issuance');
		$t = @$type[0];
		if (isset($t)){
			if($t == "monographic") return "Monograph Part";
			else if($t == "continuing") return "Periodical";
			else return "";
		} else {
			return "";
		}
	}
}

function getTitle($node, $type){
	if ($type == "Monograph Whole") $title = $node->xpath('titleInfo/title');
	else if ($type == "Monograph Part") $title = $node->xpath('relatedItem/titleInfo/title');
	else return null;
	
	$t = @$title[0];
	if (isset($t)) return $t;
	else return "";
}

function getAuthor($node, $type){
	if ($type == "Monograph Whole") $aut = $node->xpath('name/namePart');
	else if ($type == "Monograph Part") $aut = $node->xpath('relatedItem/name/namePart');
	else return null;
	
	$a = @$aut [0];
	if (isset($a)) return $a;
	else return "";
}

function getPublisher($node, $type){
	if ($type == "Monograph Whole") $pub = $node->xpath('originInfo/publisher');
	else if ($type == "Monograph Part") $pub = $node->xpath('relatedItem/originInfo/publisher');
	else return null;

	$p = @$pub[0];
	if (isset($p)) return $p;
	else return "";
}

function getPoint($node, $type){
	if ($type == "Monograph Whole") $point = $node->xpath('originInfo/place/placeTerm');
	else if ($type == "Monograph Part") $point = $node->xpath('relatedItem/originInfo/place/placeTerm');
	else return null;
	
	$p = @$point[0];
	if (isset($p)) return $p;
	else return "";
}

function getStart($node, $type){
	if ($type == "Monograph Whole") $dateStr = $node->xpath('originInfo/dateIssued');
	else if ($type == "Monograph Part") $dateStr = $node->xpath('relatedItem/originInfo/dateIssued');
	else return null;
	
	$d = @$dateStr[0];
   
	if (isset($d)) $date = $d;
	else $date = "";
	
	if ($date != "") {
		preg_match("/\d{4}/", $date, $match);
		$ret = @$match[0];

		$month = frenchMonthsToNum($d);
		if ($month > 0) $ret = $ret."-".$month;
	} else {
		$ret = null;
	}	
	return $ret;
}

function getEnd($node){
	return getStart($node);
}
?>
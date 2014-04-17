<?php
/**
 * XML data parser
 * @author Hamman Samuel
 */

set_time_limit(3600);

function processFiles($dirpath) {
    if ($handle = opendir($dirpath)) {
        print "{\n\"items\": [";
        while (false !== ($file = readdir($handle))) {
            if ('.' === $file) continue;
            if ('..' === $file) continue;
            processFile($dirpath, $file);
        }
        closedir($handle);
        print "\n]\n}";
    }
}

function processFile($dirpath, $file) {
    $file = file_get_contents($dirpath.$file);
    $file = str_replace('xmlns=', 'ns=', $file);
    $xml = new SimpleXMLElement($file);

    getElements($xml);
}

function printElement($element, $multi = false) {
    print outputElement($element, $multi);
}

function outputElement($element, $multi = false) {
    $out = "\n\t{";
    $out .= "\n\t\t\"label\": \"$element->label\",";
    $out .= "\n\t\t\"longLabel\": \"$element->longLabel\",";
    $out .= "\n\t\t\"asciiName\": \"$element->asciiName\",";
    $out .= "\n\t\t\"group\": \"$element->group\",";
    $out .= "\n\t\t\"subGroup\": \"$element->subGroup\",";
    $out .= "\n\t\t\"eventType\": \"$element->eventType\",";
    $out .= "\n\t\t\"startDate\": \"$element->startDate\",";
    if (isset($element->endDate)) $out .= "\n\t\t\"endDate\": \"$element->endDate\",";
    $out .= "\n\t\t\"dateType\": \"$element->dateType\",";
    if ($multi == true) $out .= "\n\t\t\"location\": $element->location,";
    else $out .= "\n\t\t\"location\": \"$element->location\",";
    if (isset($element->latLng)) {
        if ($multi == true) $out .= "\n\t\t\"latLng\": $element->latLng,";
        else $out .= "\n\t\t\"latLng\": \"$element->latLng\",";
    }
    if ($multi == true) $out .= "\n\t\t\"locationType\": $element->locationType,";
    else $out .= "\n\t\t\"locationType\": \"$element->locationType\",";
    $out .= "\n\t\t\"pointType\": \"$element->pointType\",";
    $out .= "\n\t\t\"description\": \"$element->description\"";
    $out .= "\n\t},";
    return $out;
}

function getDateGrain($start, $end) {
    if ($start == "") return "N/A";
    if ($start !== $end && $end != "") return "Range";
    if (preg_match("/^\d{4}$/", $start) == 1) return "Year";
    if (preg_match("/^\d{4}-\d{2}$/", $start) == 1) return "Month";
    if (preg_match("/^\d{4}-\d{2}-\d{2}$/", $start) == 1) return "Day";
    return "N/A";
}

function getLocationGrain($geoxml) {
    $fcl = getFeatureClass($geoxml);
    if ($fcl == 'P') return "City";
    if ($fcl == 'A') {
        $fcode = getFeatureCode($geoxml);
        if ($fcode == 'PCLI') return "Country";
        else return "Province/State";
    }
    return "Other";
}

function frenchMonthsToNum($date) {
    $mois = array("janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre");
    
    $ret = 0;
    foreach ($mois as $key=>$month) { 
        if (preg_match("/$month/", $date) == 1){
            $ret = $key+1;
            if ($ret < 9) $ret = "0$ret";
            break;
        }
    }
    return $ret;
}


function neatTrim($str, $n, $delim='...') {
   $len = strlen($str);
   if ($len > $n) {
       preg_match('/(.{' . $n . '}.*?)\b/', $str, $matches);
       return rtrim(@$matches[1]) . $delim;
   }
   else {
       return $str;
   }
}

// Geonames online service calls (outdated, replaced with local Geonames service)
function getGeoXML($point, $country = "") {
    $point = urlencode($point);

    //$url = "http://api.geonames.org/search?name_equals=$point&name_startsWith=$point&maxRows=1&username=geocwrc&orderby=relevance";
    $url = "http://localhost/exhibit/geonames/?query=$point";
    if ($country != "") $url .= "&countryBias=$country";
    
    $file = file_get_contents($url); // Geonames web service, full documentation at: http://www.geonames.org/export/web-services.html
    $file = str_replace('xmlns=', 'ns=', $file);
    $xml = new SimpleXMLElement($file);
    return $xml;
}

function getFeatureClass($node){
	$fcl = $node->xpath('/geonames/geoname/fcl');
	$f = @$fcl[0];
	if (isset($f)) return $f;
	else return "";
}

function getFeatureCode($node){
	$fcode = $node->xpath('geoname/fcode');
	$f = @$fcode[0];
	if (isset($f)) return $f;
	else return "";
}

function getLat($geoxml) {
	$lat = $geoxml->xpath('/geonames/geoname/lat'); // /GeocodeResponse/result/geometry/location/lat
	$l = @$lat[0];
	if (isset($l)) return $l;
	else return "";
}

function getLon($geoxml) {
	$lng = $geoxml->xpath('/geonames/geoname/lng'); // /GeocodeResponse/result/geometry/location/lng
	$l = @$lng[0];
    if (isset($l)) return $l;
    else return "";
}

function getCountry($geoxml) {
	$name = $geoxml->xpath('/geonames/geoname/countryName'); // /GeocodeResponse/result/geometry/location/countryName
	$n = @$name[0];
    if (isset($n)) return $n;
    else return "";
}

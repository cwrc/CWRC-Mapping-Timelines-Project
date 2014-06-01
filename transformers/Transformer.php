<?php
/**
 * XML data parser
 * @author Hamman Samuel
 */

set_time_limit(3600);

/**
 * Parse all XML files within a directory
 * @param string $dirpath - Path to directory
 */
function processFiles($dirpath)
{
    if ($handle = opendir($dirpath))
    {
        print "{\n\"items\": [";
        while (false !== ($file = readdir($handle)))
        {
            if ('.' === $file || '..' === $file)
            {
				continue;
			}
            processFile($dirpath, $file);
        }
        closedir($handle);
        print "\n]\n}";
    }
}

/**
 * Parse single XML file in a directory
 * @param string $dirpath - Path to directory
 * @param string $file - File name
 */
function processFile($dirpath, $file)
{
    $file = file_get_contents($dirpath.$file);
    $file = str_replace('xmlns=', 'ns=', $file);
    $xml = new SimpleXMLElement($file);

    getElements($xml);
}

/**
 * Print an XML block
 * @param string $element - XML block to output
 * @param bool $multi - Will contain multiple items of same attribute
 */
function printElement($element, $multi = false)
{
    print outputElement($element, $multi);
}

/**
 * Format output of XML elements
 * @param string $element - XML block to output
 * @param bool $multi - Will contain multiple items of same attribute
 * @return string - Output string
 */
function outputElement($element, $multi = false)
{
    $out = "\n\t{";
    $out .= "\n\t\t\"label\": \"$element->label\",";
    $out .= "\n\t\t\"longLabel\": \"$element->longLabel\",";
    $out .= "\n\t\t\"asciiName\": \"$element->asciiName\",";
    $out .= "\n\t\t\"group\": \"$element->group\",";
    $out .= "\n\t\t\"subGroup\": \"$element->subGroup\",";
    $out .= "\n\t\t\"eventType\": \"$element->eventType\",";
    $out .= "\n\t\t\"startDate\": \"$element->startDate\",";

    if (isset($element->endDate))
    {
		$out .= "\n\t\t\"endDate\": \"$element->endDate\",";
	}

    $out .= "\n\t\t\"dateType\": \"$element->dateType\",";

    if ($multi == true)
    {
		$out .= "\n\t\t\"location\": $element->location,";
	}
    else
    {
		$out .= "\n\t\t\"location\": \"$element->location\",";
	}

    if (isset($element->latLng)) 
    {
        if ($multi == true)
        {
			$out .= "\n\t\t\"latLng\": $element->latLng,";
		}
        else
        {
			$out .= "\n\t\t\"latLng\": \"$element->latLng\",";
		}
    }

    if ($multi == true)
    {
		$out .= "\n\t\t\"locationType\": $element->locationType,";
	}
    else
    {
		$out .= "\n\t\t\"locationType\": \"$element->locationType\",";
	}

    $out .= "\n\t\t\"pointType\": \"$element->pointType\",";
    $out .= "\n\t\t\"description\": \"$element->description\"";
    $out .= "\n\t},";

    return $out;
}

/**
 * Get date granularity
 * @param string $start - Start date
 * @param string $end - End date
 * @return string - Year, Month, Day, Range, or N/A
 */
function getDateGrain($start, $end)
{
    if ($start == "")
    {
		return "N/A";
	}
    if ($start !== $end && $end != "")
    {
		return "Range";
	}
    if (preg_match("/^\d{4}$/", $start) == 1)
    {
		return "Year";
	}
    if (preg_match("/^\d{4}-\d{2}$/", $start) == 1)
    {
		return "Month";
	}
    if (preg_match("/^\d{4}-\d{2}-\d{2}$/", $start) == 1)
    {
		return "Day";
	}

    return "N/A";
}

/**
 * Get location granularity
 * @param object $geoxml - XML object
 * @return string - Country, Province/State, City, or Other
 */
function getLocationGrain($geoxml)
{
    $fcl = getFeatureClass($geoxml);
    if ($fcl == 'P')
    {
		return "City";
	}
    if ($fcl == 'A')
    {
        $fcode = getFeatureCode($geoxml);
        if ($fcode == 'PCLI')
        {
			return "Country";
		}
        else
        {
			return "Province/State";
		}
    }
    return "Other";
}

/**
 * Convert French-named months to numeric value
 * @param string $date - Date with French names
 * @return int
 */
function frenchMonthsToNum($date)
{
    $mois = array("janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre");
    
    $ret = 0;
    foreach ($mois as $key=>$month)
    { 
        if (preg_match("/$month/", $date) == 1)
        {
            $ret = $key+1;
            if ($ret < 9)
            {
				$ret = "0$ret";
			}
            break;
        }
    }
    return $ret;
}

/**
 * Trims string without cutting word in the middle
 * @param string $str - String to trim
 * @param string $n - Number of words to contain in trimmed string
 * @param string $delim - The characters to append to end of the trimmed string
 */
function neatTrim($str, $n, $delim='...')
{
   $len = strlen($str);
   if ($len > $n)
   {
       preg_match('/(.{' . $n . '}.*?)\b/', $str, $matches);
       return rtrim(@$matches[1]) . $delim;
   }
   else 
   {
       return $str . ".";
   }
}

// *** Current impelementation has SOAP-like calls, doesn't use the following functions *** 

/**
 * (Legacy) Get geospatial information from local CWRC GeoNames RESTful service
 * @param string $point - Name of point/location
 * @param string $country - Name of country to search within
 * @return object - XML object containing results
 */

function getGeoXML($point)
{
    $point = urlencode($point);

    $url = "http://localhost/exhibit/geonames/?query=$point";
    $file = file_get_contents($url);
    $file = str_replace('xmlns=', 'ns=', $file);
    $xml = new SimpleXMLElement($file);

    return $xml;
}

/**
 * (Legacy) Get feature class from XML
 * @param object $node - Node containing geo-info
 * @return string
 */
function getFeatureClass($node)
{
	$fcl = $node->xpath('/geonames/geoname/fcl');
	$f = @$fcl[0];
	if (isset($f))
	{
		return $f;
	}
	else 
	{
		return "";
	}
}

/**
 * (Legacy) Get feature code from XML
 * @param object $node - Node containing geo-info
 * @return string
 */
function getFeatureCode($node)
{
	$fcode = $node->xpath('geoname/fcode');
	$f = @$fcode[0];
	if (isset($f))
	{
		return $f;
	}
	else
	{
		return "";
	}
}

/**
 * (Legacy) Get latitude from XML
 * @param object $geoxml - Geo-info
 * @return string
 */
function getLat($geoxml)
{
	$lat = $geoxml->xpath('/geonames/geoname/lat');
	$l = @$lat[0];
	if (isset($l))
	{
		return $l;
	}
	else
	{
		return "";
	}
}

/**
 * (Legacy) Get longitude from XML
 * @param object $geoxml - Geo-info
 * @return string
 */
function getLon($geoxml)
{
	$lng = $geoxml->xpath('/geonames/geoname/lng');
	$l = @$lng[0];
    if (isset($l))
    {
		return $l;
	}
    else
    {
		return "";
	}
}

/**
 * (Legacy) Get country from XML
 * @param object $geoxml - Geo-info
 * @return string
 */
function getCountry($geoxml)
{
	$name = $geoxml->xpath('/geonames/geoname/countryName');
	$n = @$name[0];
    if (isset($n))
    {
		return $n;
	}
    else
    {
		return "";
	}
}

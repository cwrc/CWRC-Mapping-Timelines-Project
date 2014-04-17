<?php
include('Transformer.php');
include('Element.php');
include('../geonames/Geonames.cls.php');
include('../dbconfig.php');

define("MODS_RECORD", "solr_doc");
define("MODS_PLACE", "mods_originInfo_place_placeTerm_text_ms");
define("MODS_DATE", "mods_originInfo_keyDate_yes_dateIssued_s");
define("MODS_TITLE", "mods_titleInfo_title_ms");
define("MODS_AUTHOR", "mods_name_personal_namePart_mt");
define("MODS_PUBLISHER", "mods_originInfo_publisher_mt");
define("MODS_ISSUANCE", "mods_originInfo_issuance_ms");

$cachefile = getcwd().'/cache/biblifo.json'; // Cache file location
$cachesourcefile = getcwd().'/cache/biblifo_source.json'; // CWRC repository source cache

print_r(check_cache());

/**
 * Checks if this collection's data has already been cached
 * @global string $cachefile
 * @return JSON
 */
function check_cache() 
{
    global $cachefile;
    if (!is_readable($cachefile))
    {
        generate_cache();
    }
    $contents = file_get_contents($cachefile);
    return $contents;
}

/**
 * Generates cache of this collection
 */
function generate_cache() 
{
    $contents = check_source_cache();
    $result = json_decode($contents, true);
    $result = $result['response']['objects'];
    $threshold = 0;
    $geonames = new Geonames(DBNAME, DBUSER, DBPASS);
    
    $out = "{\n\"items\": [";
    foreach($result as $record) 
    {
        $threshold++;        
        $el = new Element();
        $record = $record[MODS_RECORD];
        
        if (!isset($record[MODS_PLACE][0]) && !isset($record[MODS_DATE][0]))
        {
            continue;
        }

        $el->label = htmlentities($record[MODS_TITLE][0]);
        $el->longLabel = neatTrim($el->label, 40);;
        $el->group = 'BIBLIFO';
        $el->subGroup = get_mono($record[MODS_ISSUANCE][0]);
        $el->eventType = 'Bibliography';
        
        if (isset($record[MODS_DATE][0]))
        {
            $el->startDate = $record[MODS_DATE];
            $el->dateType = getDateGrain($el->startDate, $el->startDate);
        }

        $locgrain = "N/A";
        $pointtype = "N/A";
		
        if (isset($record[MODS_PLACE][0]))
        {
            $point = $record[MODS_PLACE][0];
            $location = htmlentities($point);

            $geoxml = $geonames->get_results($point, 1, '', ''); 
            $geoxml = (object) $geoxml[0];

            if ($geoxml === "")
            {
                // @todo Use external web service
            }
            
            $ctry = $geonames->get_country_name($geoxml->country_code);
            if ($ctry != "") 
            {
                $location .= ", ".$ctry;
            }

            $el->location = $location;
            $el->asciiName = $geoxml->asciiname;
            $lat = $geoxml->latitude;
            $lon = $geoxml->longitude;
            
            if ($lon != "" && $lat != "") 
            {
                $el->latLng = "$lat,$lon";
            }
            
            $pointtype = "Point";
            $locgrain = $geonames->get_location_grain($geoxml->feature_class, $geoxml->feature_code);
        }
        $el->locationType = $locgrain;
        $el->pointType = $pointtype;
        
        if (isset($record[MODS_AUTHOR][0]))
        {
            $author = $record[MODS_AUTHOR][0].".";
        }
        else
        {
            $author = "";
        }

        if (isset($record[MODS_PUBLISHER][0]))
        {
            $publisher = $record[MODS_PUBLISHER][0].".";
        }
        else
        {
            $publisher = "";
        }

        if ($location != "") 
        {
            if ($el->startDate != "") 
            {
                $location .= ":";
            }
            else 
            {
                $location .= ".";
            }
        }
        $el->description = "$author <i>$el->label</i>. $publisher $location $el->startDate";
        
        $out .= outputElement($el);
    }
    $out .= "\n]\n}";
    write_cache($out);
}

/**
 * Checks whether the CWRC API source has been cached
 * @global string $cachesourcefile
 * @return JSON
 */
function check_source_cache() 
{
    global $cachesourcefile;
    if (!is_readable($cachesourcefile))
    {
        generate_cache_source();
    }
    $contents = file_get_contents($cachesourcefile);
    return $contents;
}

/**
 * Generates source cache using CWRC Public API
 * @global string $cachesourcefile
 */
function generate_cache_source()
{
    global $cachesourcefile;
    $fileurl = "http://cwrc-dev-01.srv.ualberta.ca/islandora/rest/v1/solr/?wt=json&limit=99999&f%5B%5D=RELS_EXT_isMemberOfCollection_uri_ms:info\:fedora\/islandora\:abda880b-55d8-4d4a-b08a-e919e77e9a1b";
    $contents = file_get_contents($fileurl);
    file_put_contents($cachesourcefile, $contents);
}

/**
 * Writes cache information to server disk
 * @global string $cachefile
 * @param type $content
 */
function write_cache($content) {
    global $cachefile;
    file_put_contents($cachefile, $content);
}

/**
 * Returns monograph type
 * @param type $t
 * @return string
 */
function get_mono($t) 
{
    if ($t == "monographic") 
    {
        return "Monograph Whole";
    } 
    else if($t == "monographic") 
    {
        return "Monograph Part";
    }
    else if($t == "continuing") 
    {
        return "Periodical";
    }
    else 
    {
        return "";
    }
}
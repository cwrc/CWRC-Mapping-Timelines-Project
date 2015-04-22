<?php
/**
 * CWRC implementation of Geonames as RESTful service
 *
 * @usage e.g. http://apps.testing.cwrc.ca/cwrc-mtp/geonames/?query=Edmonton
 * 
 * @param GET string query      - The name to search for
 * @param GET int max_results 	- Max number of results to return
 * @return string array XML 	- Returned XML contains cities that match the query, and conforms with Geonames schema for seamless integration
 *
 * @author Hamman Samuel <hwsamuel@ualberta.ca>
 */
 
require_once('Geonames.cls.php');
require_once('../dbconfig.php'); // Remember to edit this file according to your MySQL server settings

// Call local Geonames service to look up and return results
$geonames = new Geonames(DBNAME, DBUSER, DBPASS, DBTABLE, DBTABLECOUNTRY); // Constant values are read from dbconfig.php
$geonames->output_as_xml($geonames->get_results(get_query(), get_max_results()));

/** 
 * Get query to search for using GET method
 * @return string
 */
function get_query()
{
    return filter_input(INPUT_GET, 'query', FILTER_SANITIZE_STRING);
}

/** 
 * Get max number of results to return
 * @return int
 */
function get_max_results()
{
    $max = filter_input(INPUT_GET, 'max_results', FILTER_SANITIZE_STRING);
    if ($max == NULL)
    {
        return 10;
    }
    else
    {
        return $max;
    }
}

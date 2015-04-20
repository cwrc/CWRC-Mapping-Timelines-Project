<?php
/**
 * Geonames service for searching city names and returning useful information such as lat, long
 *
 * @author Hamman Samuel <hwsamuel@ualberta.ca>
 */

require_once("libs/rb/rb.php");

class Geonames
{
    private $table_name;
    private $table_country;
    /**
     * Connect to MySQL database
     * @param string $db_name - Database name
     * @param string $db_user - Username
     * @param string $db_pass - User password
     * @param string $table_name - Name of table
     */
    function __construct($db_name, $db_user, $db_pass, $table_name, $table_country)
    {
        R::setup("mysql:host=localhost;dbname=$db_name", $db_user, $db_pass);
        R::freeze(TRUE);
        R::debug(FALSE);
        $this->table_name = $table_name;
        $this->table_country = $table_country;
    }

    /**
     * Return query results
     * @param string $query - The query
     * @return array - The results that match
     */
    function get_results($query, $limit = 10)
    {
        if (trim($query) == "")
        {
            return;
        }

        // Generated query is filtering by only feature classes that are countries, cities, places, etc.
        $querystr = "SELECT geonameid, name, asciiname, latitude, longitude, feature_class, feature_code, country_code FROM $this->table_name WHERE (asciiname Like ?) AND (feature_class = 'A' OR feature_class = 'P') LIMIT $limit";
        $matches = R::getAll($querystr, array($query));

        // If no match found still, maximize wild-card usage
        if (empty($matches))
        {
            $matches = R::getAll($querystr, array("%$query%"));
        }
        
        return $matches;
    }

    /**
     * Get location granularity based on the feature class and feature code
     * Documentation of codes: http://www.geonames.org/export/codes.html
     * @param string $fcl - Feature class
     * @param string $fcode - Feature code
     * @return string - City or Province/State or Country or Other
     */
    function get_location_grain($fcl, $fcode)
    {
		if ($fcl == 'P')
		{
			return "City";
		}
		
		if ($fcl == 'A')
		{
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
     * Get country name
     * @param string $code - Alpha-2 ISO code string
     * @return string - The name of the country
     */
    function get_country_name($code)
    {
        if (trim($code) == "")
		{
			return;
		}
		$qry = "SELECT name FROM $this->table_country WHERE alpha2_code Like '$code' LIMIT 1"; 
		$match = R::getCell($qry);
		return $match;
    }

    /**
     * Convert results to XML in line with Geonames web service schema
     * @param array $results - The plain-text results
     * @return stdout - Printed results as valid XML, conforms with Geonames schema for seamless integration
     */
    function output_as_xml($results)
    {
        header("Content-type: text/xml");
        print "<geonames>";
        foreach($results as $result)
        {
            $result = (object) $result;
            $country_name = $this->get_country_name($result->country_code); // Use $result->country_code to look it up
            $grain = $this->get_location_grain($result->feature_class, $result->feature_code);
            print "<geoname>";
            print "<name>$result->name</name>";
            print "<asciiName>$result->asciiname</asciiName>";
            print "<lat>$result->latitude</lat>";
            print "<lng>$result->longitude</lng>";
            print "<countryCode>$result->country_code</countryCode>";
            print "<countryName>$country_name</countryName>";
            print "<fcl>$result->feature_class</fcl>";
            print "<fcode>$result->feature_code</fcode>";
            print "<geonameid>$result->geonameid</geonameid>";
            print "<granularity>$grain</granularity>";
            print "</geoname>";
        }
        print "</geonames>";
    }
}

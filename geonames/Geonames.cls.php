<?php
/**
 * Minified Geonames service for searching city names and returning useful information such as lat, long
 *
 * @author Hamman Samuel
 * @version 20140416
 */

require_once("libs/rb/rb.php");

class Geonames
{
    /**
     * Connect to MySQL database
     * @param string $db_name - Database name
     * @param string $db_user - Username
     * @param string $db_pass - User password
     */
    function __construct($db_name, $db_user, $db_pass)
    {
        R::setup("mysql:host=localhost;dbname=$db_name", $db_user, $db_pass);
        R::freeze(TRUE);
        R::debug(FALSE);
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

        $querystr = "SELECT geonameid, name, asciiname, latitude, longitude, feature_class, feature_code, country_code FROM cities WHERE asciiname Like ? LIMIT $limit";
        $matches = R::getAll($querystr, array($query));

        // If no match found so far, broaden wild-card usage
        if (empty($matches))
        {
            $matches = \R::getAll($querystr, array("$query%"));
        }
        
        // If no match found still, maximize wild-card usage
        if (empty($matches))
        {
            $matches = \R::getAll($querystr, array("%$query%"));
        }

        return $matches;
    }

    /**
     * Get location granularity based on the feature class and feature code
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
            $match = \R::getCell("SELECT name FROM countries WHERE alpha2_code Like '$code' LIMIT 1");
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
            print "</geoname>";
        }
        print "</geonames>";
    }
}

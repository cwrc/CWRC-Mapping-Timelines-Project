<?php
/**
 * Parses the Solr JSON stream and creates cached version of Plot-It JSON stream based on its schema
 */

include('Transformer.php');
include('Element.php');
include('../geonames/Geonames.cls.php');
include('../dbconfig.php');

define("MODS_RECORD", "solr_doc");
define("MODS_PLACE", "cwrc_general_place_mt");
define("MODS_DATE", "cwrc_general_date_ms");
define("MODS_TITLE", "cwrc_general_label_et");
define("MODS_DESCRIPTION", "cwrc_general_description_et");
define("MODS_COLLECTION", "RELS_EXT_isMemberOfCollection_uri_ms");

class SolrStreamParser
{
	private $cachefile;
	private $cachesourcefile;
	private $localpidcache;
	private $streamurl;
	private $cookie;
	
	/**
	 * Constructor
	 */
	public function __construct($cachefile, $cachesourcefile, $localpidcache, $streamurl, $cookie)
	{
		$this->cachefile = $cachefile;
		$this->cachesourcefile = $cachesourcefile;
		$this->localpidcache = $localpidcache;
		$this->streamurl = $streamurl;
		$this->cookie = $cookie;
	}

	/**
	 * Authenticates user
	 * @param string $url - URL to authenticate
	 * @param string $username - Username
	 * @param string $password - Password
	 */
	public function log_in($url, $username, $password)
	{
		$data = '{"username":"'.$username.'","password":"'.$password.'"}';
		
		$ch = curl_init();
		
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-type: application/json'));
		curl_setopt($ch, CURLOPT_COOKIEJAR, $this->cookie);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
		
		curl_exec($ch);
		curl_close($ch);
	}

	/**
	 * Logs out authenticated user
	 */
	public function log_out()
	{
		unlink($this->cookie);
	}

	/**
	 * Checks if this collection's data has already been cached
	 * @return JSON
	 */
	public function check_cache() 
	{
		if (!is_readable($this->cachefile))
		{
			$this->generate_cache();
		}
		$contents = file_get_contents($this->cachefile);
		return $contents;
	}

	/**
	 * Checks whether the CWRC API source has been cached
	 * @return JSON
	 */
	public function check_source_cache() 
	{
		if (!is_readable($this->cachesourcefile))
		{
			$this->generate_cache_source();
		}
		$contents = file_get_contents($this->cachesourcefile);
		return $contents;
	}

	/**
	 * Gets the data from a URL via cURL and also uses cookie for authentication
	 * @param string $url - URL to retrieve data from
	 * @return string 
	 */
	private function file_get_data($url)
	{
		$ch = curl_init();
		
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_COOKIEFILE, $this->cookie);
		
		$data = curl_exec($ch);
		curl_close($ch);
		
		return $data;
	}

	/**
	 * Generates source cache using CWRC Public API
	 */
	private function generate_cache_source()
	{
		$contents = $this->file_get_data($this->streamurl);
		file_put_contents($this->cachesourcefile, $contents);
	}

	/**
	 * Generates cache of this collection 
	 */
	private function generate_cache() 
	{
		$contents = $this->check_source_cache();
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
			
			$el->label = $record[MODS_TITLE][0];
			$el->label = str_replace('"', "'", $el->label);
			$el->longLabel = neatTrim($el->label, 40);
			
			$pid = $record[MODS_COLLECTION][0];
			$el->group = $this->get_collection_name($pid);
			$el->eventType = ""; // #todo Dynamically get event type from context, e.g. BIBLIFO = 'Biography' always
			
			if (isset($record[MODS_DATE][0]))
			{
				$el->startDate = $record[MODS_DATE][0];
				$el->dateType = getDateGrain($el->startDate, $el->startDate);
			}

			$locgrain = "N/A";
			$pointtype = "N/A";
			
			if (isset($record[MODS_PLACE][0]))
			{
				$point = $record[MODS_PLACE][0];
				$location = $point;

				$geoxml = $geonames->get_results($point, 1, '', ''); 
				
				if ($geoxml != null)
				{
					$geoxml = (object) $geoxml[0];
	
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
			}
			$el->locationType = $locgrain;
			$el->pointType = $pointtype;
			$el->description = str_replace('"', "", $record[MODS_DESCRIPTION][0]);
			
			$out .= outputElement($el);
		}
		$out .= "\n]\n}";
		$this->write_cache($out);
	}

	/**
	 * Gets collection name using PID
	 * @param string $pid - Raw PID of collection  
	 * @return string - Name of the collection
	 */
	private function get_collection_name($pid)
	{
		$pid = str_replace("islandora", "islandora%5C", $pid);
		$pid = substr($pid, 12);
		
		// Check local repo first
		$result = $this->get_pid_from_local_cache($pid);
		
		// If not found, search in CWRC
		if ($result === "")
		{
			$url = "http://cwrc-dev-01.srv.ualberta.ca/islandora/rest/v1/solr/%28PID:%28$pid%29%29";
			$info = $this->file_get_data($url);
			$result = json_decode($info, true);
			$result = $result['response']['objects'][0]['solr_doc']['fgs_label_s'];
			$this->add_pid_to_local_cache($pid, $result);
		}
		return $result;
	}
	
	/**
	 * Adds PID and name to local cache of PIDs and names for faster processing
	 * @param string $pid - Formatted PID of collection
	 * @param string $name - Name of collection
	 */
	private function add_pid_to_local_cache($pid, $name)
	{
		$data = "$pid\t$name\n";
		file_put_contents($this->localpidcache, $data, FILE_APPEND);
	}
	
	/**
	 * Gets the name of a collection using its PID from the local cache
	 * @param string $pid - The collection PID
	 * @return string - Name of the collection
	 */
	private function get_pid_from_local_cache($pid)
	{
		$item = "";
		if (!is_readable($this->localpidcache))
		{
			return $item;
		}
		
		$localcache = file_get_contents($this->localpidcache);
		$found = stripos($localcache, $pid); // Find first occurrence of PID
		
		if ($found === FALSE)
		{
			return $item;
		}
		
		$tab = stripos($localcache, "\t", $found); // Find first tab on the found line
		$lineend = stripos($localcache, "\n", $found); // Find line end on found line
		$item = substr($localcache, $tab + 1, ($lineend - $tab - 1)); // Name is within the tab and line end
		return $item;
	}
	
	/**
	 * Writes cache information to server disk
	 * @param type $content
	 */
	private function write_cache($content)
	{
		file_put_contents($this->cachefile, $content);
	}
}

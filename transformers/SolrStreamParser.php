<?php
/**
 * Parses Solr stream for a collection and creates cached version using Plot-It schema
 * @author Hamman Samuel
 * @todo Make parser work for mixed streams with multi-collections
 */

include('Transformer.php');
include('Element.php');
include('../geonames/Geonames.cls.php');
include('../geonames/dbconfig.php');

define("EVENT_OBJECT", "solr_doc");
define("EVENT_PID", "PID");
define("LOCATION_NAME", "cwrc_general_place_mt");
define("START_DATE", "cwrc_general_date_ms");
define("LONG_TITLE", "cwrc_general_label_et");
define("DESCRIPTION", "cwrc_general_description_et");

define("CACHE_DIR", __DIR__.'/cache/');

abstract class SolrStreamParser
{
	private $collection_name;
	private $solr_stream;
	private $server_base;
	
	abstract protected function get_event_type(); // Implementation is collection-specific
	
	/**
	 * Constructor
	 * @param string $collection_name - Name of collection in proper case, e.g. BIBLIFO
	 * @param string $solr_stream - JSON stream retrieved using AuthStreamReader static class
	 */
	public function __construct($collection_name, $solr_stream, $server_base)
	{
		$this->collection_name = $collection_name;
		$this->solr_stream = $solr_stream;
		$this->server_base = $server_base;

		$collection_name = strtolower($collection_name);
		$this->cache_file = CACHE_DIR.$collection_name.'.json';
		$this->solr_cache_file = CACHE_DIR.$collection_name.'_solr.json';
	}

	/**
	 * Checks if this collection's data has already been cached
	 * @return JSON
	 */
	public function check_cache() 
	{
		if (!is_readable($this->cache_file))
		{
			$this->generate_cache();
		}
		$contents = file_get_contents($this->cache_file);
		return $contents;
	}

	/**
	 * Checks whether the CWRC API source has been cached
	 * @return JSON
	 */
	public function check_solr_cache() 
	{
		if (!is_readable($this->solr_cache_file))
		{
			$this->generate_solr_cache();
		}
		$contents = file_get_contents($this->solr_cache_file);
		return $contents;
	}

	/**
	 * Generates source cache using CWRC Public API
	 */
	private function generate_solr_cache()
	{
		file_put_contents($this->solr_cache_file, $this->solr_stream);
	}
	
	/**
	 * Generates cache of this collection 
	 */
	private function generate_cache() 
	{
		$contents = $this->check_solr_cache();
		$result = json_decode($contents, TRUE);
		$result = $result['response']['objects'];
		$geonames = new Geonames(DBNAME, DBUSER, DBPASS, DBTABLE);
		
		$out = "{\n\"items\": [";
		foreach($result as $record) 
		{
			$el = new Element();
			
			$el->pid = $record[EVENT_PID];
			$el->source = "$this->server_base/islandora/object/$el->pid/";
			
			$record = $record[EVENT_OBJECT];
			
			$el->group = $this->collection_name;
			$el->event_type = $this->get_event_type(); // Abstract function
			
			$el->date_type = "Unknown";
			if (isset($record[START_DATE][0]))
			{
				$el->start_date = Transformer::date_parse($record[START_DATE][0]);
				$el->date_type = Transformer::get_date_grain($el->start_date, $el->start_date);
			}

			$locgrain = "Unknown";
			$pointtype = "Unknown";
			if (isset($record[LOCATION_NAME][0]))
			{
				$point = $record[LOCATION_NAME][0];
				$location = $point;

				$geoxml = $geonames->get_results($point, 1, '', ''); 
				
				if ($geoxml != NULL)
				{
					$geoxml = (object) $geoxml[0];
	
					$ctry = $geonames->get_country_name($geoxml->country_code);
					if ($ctry != "") 
					{
						$location .= ", $ctry";
					}
	
					$el->location = $location;
					$el->asciiname = $geoxml->asciiname;
					$lat = $geoxml->latitude;
					$lon = $geoxml->longitude;
					
					if ($lon != "" && $lat != "") 
					{
						$el->lat_lng = "$lat,$lon";
					}
					
					$pointtype = "Point";
					$locgrain = $geonames->get_location_grain($geoxml->feature_class, $geoxml->feature_code);
				}
			}
			$el->location_type = $locgrain;
			$el->point_type = $pointtype;

			$el->long_label = str_replace('"', "'", $record[LONG_TITLE][0]);
			$el->label = Transformer::neat_trim($el->long_label, 35);
			$el->label = Transformer::format_label($el->label, $el->start_date, $el->end_date, $el->location);
			$el->description = str_replace('"', "", $record[DESCRIPTION][0]);
			
			$out .= Transformer::output_element($el);
		}
		$out .= "\n]\n}";
		$this->write_cache($out);
	}

	/**
	 * Writes cache information to server disk
	 * @param string $content
	 */
	private function write_cache($content)
	{
		file_put_contents($this->cache_file, $content);
	}	
}

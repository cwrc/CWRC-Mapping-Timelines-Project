<?php
/**
 * XML data parser
 * @author Hamman Samuel
 */

set_time_limit(3600);

class Transformer
{
	/**
	 * Parse all XML files within a directory
	 * @param string $dirpath - Path to directory
	 */
	public static function process_files($dirpath)
	{
		if ($handle = opendir($dirpath))
		{
			print "{\n\"items\": [";
			while (($file = readdir($handle)) != FALSE)
			{
				if ($file == '.' || $file == '..')
				{
					continue;
				}
				process_file($dirpath, $file);
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
	private static function process_file($dirpath, $file)
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
	private static function print_element($element, $multi = FALSE)
	{
		print output_element($element, $multi);
	}

	/**
	 * Format output of XML elements
	 * @param string $element - XML block to output
	 * @param bool $multi - Will contain multiple items of same attribute
	 * @return string - Output string
	 */
	public static function output_element($element, $multi = FALSE)
	{
		$out = "\n\t{";
		$out .= "\n\t\t\"pid\": \"$element->pid\",";
		$out .= "\n\t\t\"source\": \"$element->source\",";
		$out .= "\n\t\t\"label\": \"$element->label\",";
		$out .= "\n\t\t\"longLabel\": \"$element->long_label\",";
		$out .= "\n\t\t\"asciiName\": \"$element->asciiname\",";
		$out .= "\n\t\t\"group\": \"$element->group\",";
		$out .= "\n\t\t\"eventType\": \"$element->event_type\",";
		
		if ($element->start_date != "")
		{
			$out .= "\n\t\t\"startDate\": \"$element->start_date\",";
		}
		
		if (isset($element->end_date))
		{
			$out .= "\n\t\t\"endDate\": \"$element->end_date\",";
		}

		$out .= "\n\t\t\"dateType\": \"$element->date_type\",";

		if ($element->location != "")
		{
			if ($multi == TRUE)
			{
				$out .= "\n\t\t\"location\": $element->location,";
			}
			else
			{
				$out .= "\n\t\t\"location\": \"$element->location\",";
			}
		}
		
		if (isset($element->lat_lng)) 
		{
			if ($multi == TRUE)
			{
				$out .= "\n\t\t\"latLng\": $element->lat_lng,";
			}
			else
			{
				$out .= "\n\t\t\"latLng\": \"$element->lat_lng\",";
			}
		}

		if ($multi == TRUE)
		{
			$out .= "\n\t\t\"locationType\": $element->location_type,";
		}
		else
		{
			$out .= "\n\t\t\"locationType\": \"$element->location_type\",";
		}

		$out .= "\n\t\t\"pointType\": \"$element->point_type\",";
		$out .= "\n\t\t\"description\": \"$element->description\"";
		$out .= "\n\t},";

		return $out;
	}

	/**
	 * Parse date and return valid format
	 * @param string $raw_date - The date to parse
	 * @return string
	 */
	public static function date_parse($raw_date)
	{
		if ($raw_date == "")
		{
			return "";	
		}
		
		// Convert French names to English
		$raw_date = self::date_language_convert($raw_date);
		
		$parsed = date_parse($raw_date);
		
		$ret = "";
		if ($parsed['year'] != FALSE && ($parsed['year'] - date('Y')) <= 0)
		{
			$ret .= $parsed['year'];
		}
		
		if ($ret != "" && $parsed['month'] != FALSE)
		{
			$m = $parsed['month'];
			if (strlen($m) < 2)
			{
				$m = "0$m";
			}
			$ret .= "-$m";
		}
		
		if ($ret != "" && $parsed['day'] != FALSE)
		{
			$d = $parsed['day'];
			if (strlen($d) < 2)
			{
				$d = "0$d"; 
			}
			$ret .= "-$d";
		}

		if ($ret == "")
		{
			if (preg_match("/\d{4}/", $raw_date, $matches) == 1)
			{
				if ($matches[0] - date('Y') <= 0)
				{
					$ret = $matches[0];
				}
			}
		}
		
		return $ret;
	}

	/** 
	 * Extract year from date
	 * @param string $date - Date to parse
	 * @return string - Year
	 */
	public static function year_parse($date)
	{
		$ret = "";
		if (preg_match("/\d{4}/", $date, $matches) == 1)
		{
			if ($matches[0] <= date('Y'))
			{
				$ret = $matches[0];
			}
		}
		
		return $ret;
	}
	
	/**
	 * Get date granularity
	 * @param string $start - Start date
	 * @param string $end - End date
	 * @return string - Year, Month, Day, Range, or Unknown
	 */
	public static function get_date_grain($start, $end)
	{
		if ($start == "")
		{
			return "Unknown";
		}
		if ($start != $end && $end != "")
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

		return "Unknown";
	}

	/**
	 * Convert French-named dates to English ones
	 * @param string $date - Date with French names
	 * @return string - Names replaced
	 */
	public static function date_language_convert($date)
	{	
		$french = array("/janvier/","/f�vrier/","/mars/","/avril/","/mai/","/juin/","/juillet/","/ao�t/","/septembre/","/octobre/","/novembre/","/d�cembre/");
		$english = array("january","february","march","april","may","june","july","august","september","october","november","december");
		
		$date = strtolower($date);
		
		return preg_replace($french, $english, $date);
	}

	/**
	 * Trims string without cutting word in the middle
	 * @param string $str - String to trim
	 * @param string $n - Number of words to contain in trimmed string
	 * @param string $delim - The characters to append to end of the trimmed string
	 */
	public static function neat_trim($str, $n, $delim='...')
	{
	   $len = strlen($str);
	   if ($len > $n)
	   {
		   preg_match('/(.{' . $n . '}.*?)\b/', $str, $matches);
		   return rtrim(@$matches[1]) . $delim;
	   }
	   else 
	   {
		   return $str;
	   }
	}

	/**
	 * Properly formats label to add identifier
	 * Unique identifier is made with location and dates
	 * @param string $label - Raw label
	 * @param string $start_date - Start date
	 * @param string $end_date - End date
	 * @param string $location - Location
	 * @return string - Formatted label
	 */
	public static function format_label($label, $start_date, $end_date, $location)
	{
		$start_year = Transformer::year_parse($start_date);
		$end_year = Transformer::year_parse($end_date);
		
		$id = "";
		if ($location != "")
		{
			$id = $location;
		}
	
		if ($start_year != "")
		{
			if ($id == "")
			{
				$id .= $start_year;
			}
			else
			{
				$id .= ", $start_year";
			}
		} 
		
		if ($start_year != "" && $end_year != "" && $start_year != $end_year)
		{
			$id .= " to $end_year";
		}
		
		if ($id == "")
		{
			return $label;
		}
		else 
		{
			return "$label ($id)";
		}
	}
}
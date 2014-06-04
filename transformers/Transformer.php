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
		$out .= "\n\t\t\"label\": \"$element->label\",";
		$out .= "\n\t\t\"longLabel\": \"$element->longLabel\",";
		$out .= "\n\t\t\"asciiName\": \"$element->asciiName\",";
		$out .= "\n\t\t\"group\": \"$element->group\",";
		$out .= "\n\t\t\"eventType\": \"$element->eventType\",";
		$out .= "\n\t\t\"startDate\": \"$element->startDate\",";

		if (isset($element->endDate))
		{
			$out .= "\n\t\t\"endDate\": \"$element->endDate\",";
		}

		$out .= "\n\t\t\"dateType\": \"$element->dateType\",";

		if ($multi == TRUE)
		{
			$out .= "\n\t\t\"location\": $element->location,";
		}
		else
		{
			$out .= "\n\t\t\"location\": \"$element->location\",";
		}

		if (isset($element->latLng)) 
		{
			if ($multi == TRUE)
			{
				$out .= "\n\t\t\"latLng\": $element->latLng,";
			}
			else
			{
				$out .= "\n\t\t\"latLng\": \"$element->latLng\",";
			}
		}

		if ($multi == TRUE)
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
	 * Parse date and return valid format
	 * @param string $raw_date - The date to parse
	 * @return string
	 */
	public static function date_parse($raw_date)
	{
		$date = "";
		if ($raw_date == $date)
		{
			return $raw_date;	
		}
		
		// Convert French names to English
		$raw_date = self::date_language_convert($raw_date);
		
		$parsed = date_parse($raw_date);
		if ($parsed == FALSE)
		{
			return $date;
		}

		$ret = "";
		if ($parsed['year'] == FALSE || $parsed['year'] > date('Y'))
		{
			return $ret;
		}
		else 
		{
			$ret .= $parsed['year']; 
		}
		
		if ($parsed['month'] == FALSE)
		{
			return $ret;
		}
		else 
		{
			$ret .= "-".$parsed['month'];
		}
		
		if ($parsed['day'] == FALSE)
		{
			return $ret;
		}
		else
		{
			$ret .= "-".$parsed['day'];
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
	private static function date_language_convert($date)
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
}
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
			while (false !== ($file = readdir($handle)))
			{
				if ('.' === $file || '..' === $file)
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
	private static function print_element($element, $multi = false)
	{
		print output_element($element, $multi);
	}

	/**
	 * Format output of XML elements
	 * @param string $element - XML block to output
	 * @param bool $multi - Will contain multiple items of same attribute
	 * @return string - Output string
	 */
	public static function output_element($element, $multi = false)
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
	public static function get_date_grain($start, $end)
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
	 * Convert French-named months to numeric value
	 * @param string $date - Date with French names
	 * @return int
	 */
	public static function french_months_to_num($date)
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
		   return $str . ".";
	   }
	}
}
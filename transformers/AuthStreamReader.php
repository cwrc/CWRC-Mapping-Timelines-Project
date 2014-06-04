<?php 
/**
 * Used to retrieve a data strea with authentication 
 * @author Hamman Samuel
 */

class AuthStreamReader
{
	private static $initialized = FALSE;
	private static $cookie;
	
	private static function __init()
	{
		if (self::$initialized == FALSE)
		{
			self::$cookie = tempnam('/tmp','cookie.txt');
		}
	}
	
	/**
	 * Authenticates user
	 * @param string $url - URL to authenticate
	 * @param string $username - Username
	 * @param string $password - Password
	 */
	public static function log_in($url, $username, $password)
	{
		self::__init();
		$data = '{"username":"'.$username.'","password":"'.$password.'"}';
	
		$ch = curl_init();
	
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-type: application/json'));
		curl_setopt($ch, CURLOPT_COOKIEJAR, self::$cookie);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
	
		curl_exec($ch);
		curl_close($ch);
	}
	
	/**
	 * Logs out authenticated user
	 */
	public static function log_out()
	{
		self::__init();
		unlink(self::$cookie);
	}
	
	/**
	 * Gets the data from a URL via cURL and also uses cookie for authentication
	 * @param string $url - URL to retrieve data from
	 * @return string
	 */
	public static function file_get_contents($url)
	{
		self::__init();
		$ch = curl_init();
	
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_COOKIEFILE, self::$cookie);
	
		$data = curl_exec($ch);
		curl_close($ch);
	
		return $data;
	}
}
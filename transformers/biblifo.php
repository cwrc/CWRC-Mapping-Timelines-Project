<?php
/**
 * Parses the Solr stream for BIBLIFO
 * @author Hamman Samuel
 */

include('SolrStreamParser.php');
include('AuthStreamReader.php');

class Biblifo extends SolrStreamParser
{
	public function get_event_type()
	{
		return "Bibliography";
	}
}

AuthStreamReader::log_in('http://cwrc-dev-01.srv.ualberta.ca/rest/user/login', 'yourusername', 'yourpassword');
$contents = AuthStreamReader::file_get_contents('http://cwrc-dev-01.srv.ualberta.ca/islandora/rest/v1/solr/?wt=json&limit=99999&f%5B%5D=RELS_EXT_isMemberOfCollection_uri_ms:info\:fedora\/islandora\:abda880b-55d8-4d4a-b08a-e919e77e9a1b');

$biblifo = new Biblifo('BIBLIFO', $contents);
print_r($biblifo->check_cache());

AuthStreamReader::log_out();

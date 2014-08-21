<?php
/**
 * Parses the Solr stream for Paper Speaking
 * @author Hamman Samuel
 */

include('SolrStreamParser.php');
include('AuthStreamReader.php');

class PaperSpeaking extends SolrStreamParser
{
	public function get_event_type()
	{
		return "Bibliography";
	}
}

AuthStreamReader::log_in('pspea', 'http://beta.cwrc.ca/rest/user/login', 'hsamuel', 'crwCwr#4');
$contents = AuthStreamReader::file_get_contents('http://beta.cwrc.ca/islandora/rest/v1/solr/?wt=json&limit=99999&f[]=RELS_EXT_isMemberOfCollection_uri_ms:info\:fedora\/cwrc\:8ba509b8-905c-448b-8265-f095f21e019d');

$pspeak = new PaperSpeaking('PaperSpeaking', $contents, 'http://beta.cwrc.ca');
print_r($pspeak->check_cache());

AuthStreamReader::log_out();

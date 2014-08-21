<?php
/**
 * Parses the Solr stream for Orlando Events
 * @author Hamman Samuel
 */

include('SolrStreamParser.php');
include('AuthStreamReader.php');

class OrlandoEvents extends SolrStreamParser
{
	public function get_event_type()
	{
		return "Bibliography";
	}
}

AuthStreamReader::log_in('oreve', 'http://cwrc-dev-01.srv.ualberta.ca/rest/user/login', 'hsamuel', 'crwCwr#4');
$contents = AuthStreamReader::file_get_contents('http://cwrc-dev-01.srv.ualberta.ca/islandora/rest/v1/solr/?wt=json&limit=99999&f[]=RELS_EXT_isMemberOfCollection_uri_ms:info\:fedora\/cwrc\:orlando_canadian_events_2014-04-25');

$oevents = new OrlandoEvents('OrlandoEvents', $contents, 'http://cwrc-dev-01.srv.ualberta.ca');
print_r($oevents->check_cache());

AuthStreamReader::log_out();

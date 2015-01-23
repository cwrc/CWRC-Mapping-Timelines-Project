<?php
/**
 * Parses the Solr stream
 * @author Hamman Samuel
 */

include('SolrStreamParser.php');
include('AuthStreamReader.php');

class Sample extends SolrStreamParser
{
	// Over-ride method per collection
	public function get_event_type()
	{
		return "EventType";
	}
}

AuthStreamReader::log_in('http://auth.login.rest.api', 'username', 'passwd');
$contents = AuthStreamReader::file_get_contents('http://json.stream.for.collection/has.to.match.solr_schema');

$sample = new Sample('SampleName', $contents, 'http://base.server.url');
print_r($sample->check_cache());

AuthStreamReader::log_out();

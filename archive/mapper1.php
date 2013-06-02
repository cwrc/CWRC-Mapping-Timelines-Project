<?php
$file = file_get_contents('xml/'.$_REQUEST['file']);
$file = str_replace('xmlns=', 'ns=', $file);
$xml = new SimpleXMLElement($file);


$elements = $xml->xpath('/TEI/text/body/div');

function getElements($xml){

$elements = $xml->xpath('/TEI/text/body/div');
while (list( ,$node) = each($elements)){
   print "{ \n";
   
   $start = getStart($node);
   print "\t\"start\" : \"$start\",\n";

   $end = getEnd($node);
   if ($end !== ""){
       print "\t\"end\" : \"$end\",\n";
   }

   $point = getPoint($node);
   $geoxml = getGeoXML($point);
   $lat = getLat($geoxml);
   $lon = getLon($geoxml);
   
   print "\t\"point\" : ";
   print "\n\t{";
   print "\n\t\t\"lat\" : $lat,";
   print "\n\t\t\"lon\" : $lon";
   print "\n\t},\n";
 
   $title = getTitle($node);
   print "\t\"title\" : \"$title\",\n";
   
   $options = getOptions($node);
   print "\t\"options\" : ";
   print "\n\t{";
   print "\n\t\t\"infoHtml\" : \"<div style='font-size: 8pt; word-wrap:break-word;'>";
   print "<p><strong>$title</strong></p>";
   
   $media = $node->xpath('media/url');
   $imgs = @$media[0];
   if (isset($imgs)) print "<img src='$imgs' style='padding: 5px; float: left; width: 75px;'>";
   $imgs = @$media[1];
   if (isset($imgs)) print "<img src='$imgs' style='padding: 5px; float: left; width: 75px;'>";
   
   $video = $node->xpath('media/video');
   $vids = @$video[0];
   if (isset($vids)) print "<iframe width='250' height='200' src='$vids' frameborder='0' allowfullscreen='false'></iframe>";
   
   $link = $node->xpath('media/link');
   $lnk = @$link[0];
   if (isset($lnk)) print "<b><a href='$lnk' target='_blank'>".$lnk['title']."</a></b>";
   
   print $options;
   print "</div>\"";
   print "\n\t}\n";
 
   print "},\n"; 
}
}

function getStart($node){
$date = $node->xpath('p/date');
   $d = $date[0];
   if (isset($d['from'])){
       return $d['from'];
   }else{
       return $d['when'];
   }

}

function getEnd($node){
$date = $node->xpath('p/date');
   $d = $date[0];

   if (isset($d['to'])){
       return $d['to'];
   }else{
       return "";
   }
}

function getPoint($node){
   $point = $node->xpath('p/placeName');
   $p = @$point[0];
   if (isset($p)){
	   $p = preg_replace("/\s+/", "", $p);
       return $p;
   }else{
     return "";
   }
}

function getGeoXML($point) {
   $file = file_get_contents("http://maps.googleapis.com/maps/api/geocode/xml?address=$point&sensor=false");
   $file = str_replace('xmlns=', 'ns=', $file);
   $xml = new SimpleXMLElement($file);
   return $xml;
}

function getLat($geoxml) {
	$lat = $geoxml->xpath('/GeocodeResponse/result/geometry/location/lat');
	$l = @$lat[0];
    if (isset($l)){
       $l = preg_replace("/\s+/", " ", $l); 
       return $l;
    }else{
	   return -82.8627519; // Antartica
	}
}

function getLon($geoxml) {
	$lng = $geoxml->xpath('/GeocodeResponse/result/geometry/location/lng');
	$l = @$lng[0];
    if (isset($l)){
       $l = preg_replace("/\s+/", " ", $l); 
       return $l;
    }else{
	   return -135.0000000; // Antartica
	}
}

function getTitle($node){
    $title = $node->xpath('p/title');
    $t = @$title[0];
    if (isset($t)){
       $t = preg_replace("/\s+/", " ", $t); 
       return $t;
    }else{
       $title = $node->xpath('note/bibl/title');   
       $t = @$title[0];
       if (isset($t)){
         $t = preg_replace("/\s+/", " ", $t); 
         return $t;
       }else{
          $title = $node->xpath('p/orgName');
          $t = $title[0];
          if (isset($t)){
             $t = preg_replace("/\s+/", " ", $t); 
             return $t;
          }else{
             $title = $node->xpath('note/bibl/orgName');
             $t = $title[0];
             if (isset($t)){
                $t = preg_replace("/\s+/", " ", $t); 
                return $t;
              }else{
               $title = $node->xpath('p');
                $t = $title[0];
                $text = $t->asXML();
                $text = preg_replace("/\s+/", " ", $text); 
                $pos = strpos($text,"</placeName>");
                if ($pos === false){
		   return "";
                }else{
                   $t = substr($text, $pos+12, 50);
                   return $t;
                }
              }
          }
      }

    }
}



function getOptions($node){
  $divText = $node->asXML();
  preg_match_all('@<div.*?>(.+)<note>@is', $divText, $matches,PREG_SET_ORDER);

  $opText = $matches[0][1];
  $opText = preg_replace('@<.+?>@is',"",$opText);
  $opText = preg_replace('@</.+?>@is',"",$opText);
 
  $opText = preg_replace("/\s+/", " ", $opText); 
  $opText = htmlspecialchars($opText);
  return $opText;

}
getElements($xml);
?>

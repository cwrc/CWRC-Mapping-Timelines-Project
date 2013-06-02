<?php
$file = file_get_contents('xml/orlando_canadian_events_2013-03-22.xml');
$file = str_replace('xmlns=', 'ns=', $file);
$xml = new SimpleXMLElement($file);


$elements = $xml->xpath('/ORLANDO/FREESTANDING_EVENT');

function getElements($xml){

$elements = $xml->xpath('/ORLANDO/FREESTANDING_EVENT');
//$more_elements = $xml->xpath('/ORLANDO/HOSTED_EVENT');
//$elements = array_merge($elements, $more_elements);

while (list( ,$node) = each($elements)){
   print "{ \n";
   
   $start = getStart($node);
   print "\t\"start\" : \"$start\",\n";

   $end = getEnd($node);
   if ($end !== ""){
       print "\t\"end\" : \"$end\",\n";
   }

   $point = getPoint($node);
   print "\t\"point\" : \"$point\",\n";

   $title = getTitle($node);
   print "\t\"title\" : \"$title\",\n";
   
   $options = getOptions($node);
   print "\t\"options\" : ";
   print "\n\t{";
   print "\n\t\t\"infoHtml\" : \"<div style='font-size: 8pt;'>$options</div>\"";
   print "\n\t}\n";
 
   print "},\n"; 
}
}


function getStart($node){
#orlando/FREESTANDING/CHRONSTRUCT/DATE/@VALUE
#orlando/FREESTANDING/CHRONSTRUCT/DATERANGE/@FROM
#orlando/FREESTANDING/CHRONSTRUCT/DATESTRUCT/@VALUE

   $date = $node->xpath('CHRONSTRUCT/DATE');
   $d = @$date[0];
   return $d['VALUE'];
   if (isset($d['VALUE'])){
       return $d['VALUE'];
   }else{
       $date = $node->xpath('CHRONSTRUCT/DATERANGE');
       $d = $date[0];
       if (isset($d['FROM'])){
          return $d['FROM'];
       }else{
          $date = $node->xpath('CHRONSTRUCT/DATESTRUCT');
          $d = $date[0];
          if (isset($d['VALUE'])){
             return $d['VALUE'];
          }
       }
       return "";
   }

}

function getEnd($node){
#orlando/FREESTANDING/CHRONSTRUCT/DATERANGE/@TO
   $date = $node->xpath('CHRONSTRUCT/DATERANGE');
   $d = @$date[0];

   if (isset($d['TO'])){
       return $d['TO'];
   }else{
     return "";
   }
}

function getPoint($node){
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/PLACENAME
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/SETTLEMENT
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/SETTLEMENT/@REG
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/REGION
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/REGION/@REG
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/GEOG
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/GEOG/@REG
#orlando/FREESTANDING/CHRONSTRUCT/PLACE/ADDRESS/ADDRLINE   

   $point = $node->xpath('CHRONSTRUCT/CHRONPROSE/PLACE/PLACENAME');
   $p = @$point[0];
   if (isset($p)){
     $p = preg_replace("/\s+/", " ", $p);
     return $p;
   }else{
     $point = $node->xpath('CHRONSTRUCT/CHRONPROSE/PLACE/SETTLEMENT');
     $p = @$point[0];
     if (isset($p)){
		$p = preg_replace("/\s+/", " ", $p);
        return $p;
     }else{
		$point = $node->xpath('CHRONSTRUCT/CHRONPROSE/PLACE/REGION');
		$p = @$point[0];
		if (isset($p)){
		   $p = preg_replace("/\s+/", " ", $p);
		   return $p;
		}
		else{
		  $point = $node->xpath('CHRONSTRUCT/CHRONPROSE/PLACE/GEOG');
		  $p = @$point[0];
		  if (isset($p)){
		   $p = preg_replace("/\s+/", " ", $p);
		   return $p;
		  }
		  else{
			 $point = $node->xpath('CHRONSTRUCT/CHRONPROSE/PLACE/ADDRESS/ADDRLINE');
			 $p = @$point[0];
			 if (isset($p)){
				$p = preg_replace("/\s+/", " ", $p);
			   return $p;
			 }else{
			   return "";
			  }           
		  }
		}
     }
    }
}                 


function getTitle($node){
#orlando/FREESTANDING/CHRONSTRUCT/CHRONPROSE

    $title = $node->xpath('CHRONSTRUCT/CHRONPROSE');
    $t = @$title[0];
    if (!isset($t)) return;
    
    $chrText = $title->asXML();
    preg_match_all('@<CHRONPROSE.*?>(.+)</CHRONPROSE>@is', $chrText, $matches,PREG_SET_ORDER);

    $titleText = $matches[0][1];
    $tileText = preg_replace('@<.+?>@is',"",$titleText);
    $titleText = preg_replace('@</.+?>@is',"",$titleText);
 
    $titleText = preg_replace("/\s+/", " ", $titleText);
    return $titleText; 
}



function getOptions($node){
#orlando/FREESTANDING/SHORTPROSE
 
  $shrText = $node->asXML();
  preg_match_all('@<SHORTPROSE.*?>(.+)</SHORTPROSE>@is', $shrText, $matches,PREG_SET_ORDER);

  $opText = @$matches[0][1];
  $opText = preg_replace('@<.+?>@is',"",$opText);
  $opText = preg_replace('@</.+?>@is',"",$opText);
 
  $opText = preg_replace("/\s+/", " ", $opText); 
  return $opText;

}

function getCategory($node){
#orlando/FREESTANDING/CHRONSTRUCT/@CHRONCOLUMN
   
   $category = $node->xpath('CHRONSTRUCT');
   $d = $date[0];
   if (isset($d['CHRONCOLUMN'])){
       return $d['CHRONCOLUMN'];
   }else{
       return "";
   }
}
getElements($xml);
?>

<?php
$file = file_get_contents('xml/orlando_canadian_events_2013-03-22.xml');
$file = str_replace('xmlns=', 'ns=', $file);
$xml = new SimpleXMLElement($file);


$elements = $xml->xpath('/ORLANDO/FREESTANDING_EVENT');

function getElements($xml){

$elements = $xml->xpath('/ORLANDO/FREESTANDING_EVENT');
while (list( ,$node) = each($elements)){
   print "{ \n";
   
   $start = getStart($node);
   print "\"start\" : \"" .$start."\",\n";

   $end = getEnd($node);
   print "\"end\" : \"" .$end."\",\n";

   $point = getPoint($node);
   print "\"point\" : \"" .$point."\",\n";

   $title = getTitle($node);
   print "\"title\" : \"" .$title."\",\n";
   
   $options = getOptions($node);
   print "\"options\" : \"" .$options."\",\n";

   $category = getCategory($node);
   print "\"category\" : \"" .$category."\",\n";
 
   print "}\n"; 
}
}


function getStart($node){
#orlando/FREESTANDING/CHRONSTRUCT/DATE/@VALUE
#orlando/FREESTANDING/CHRONSTRUCT/DATERANGE/@FROM
#orlando/FREESTANDING/CHRONSTRUCT/DATESTRUCT/@VALUE

   $date = $node->xpath('CHRONSTRUCT/DATE');
   $d = $date[0];
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

   $pointBase = $node->xpath('CHRONSTRUCT/CHRONPROSE/PLACE');
   $point = $pointBase->xpath('PLACENAME');
   if (isset($point)){
     return $point;
   }else{
     $point = $pointBase->xpath('SETTLEMENT');
     if (isset($point)){
        return $point;
     }else{
        $point = $pointBase->xpath('SETTLEMENT');
        if (isset($point['REG'])){
           return $point;
        }
        else{
            $point = $pointBase->xpath('REGION');
            if (isset($point)){
               return $point;
            }
            else{
		$point = $pointBase->xpath('REGION');
                if (isset($point['REG'])){
                   return $point;
                }
                else{
                  $point = $pointBase->xpath('GEOG');
                  if (isset($point)){
                   return $point;
                  }
                  else{
                   $point = $pointBase->xpath('GEOG');
                   if (isset($point['REG'])){
                      return $point;
                   }
                   else{
                     $point = $pointBase->xpath('ADDRESS/ADDRLINE');
                     if (isset($point)){
                       return $point;
                     }else{
                       return "";
                      }           
                   }
                  }
                }
            }
         }
     }
    }
}                 


function getTitle($node){
#orlando/FREESTANDING/CHRONSTRUCT/CHRONPROSE

    $title = $node->xpath('CHRONSTRUCT/CHRONPROSE');
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

  $opText = $matches[0][1];
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

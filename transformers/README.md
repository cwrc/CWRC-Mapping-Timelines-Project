## Transformations

Plot-It has configured SIMILE Exhibit to accept datasets in a specific JSON schema, shown in `plotit_schema.json`. However, the CWRC datasets use a different JSON schema from their Solr services, shown in `solr_schema.json`. The transformation codes contained here convert the CWRC datasets into the accepted JSON format. This is achieved by using the PHP classes documented below. The code also allows for authentication. 

## Sample Usage

A sample file `sample.php` is provided to show how transformations can be done, including authentication. The authentication URL will most likely be different from the Solr-schema-based source URL. If required to tag events with a type for specific collections, the `get_event_type()` method will need to be overridden, as shown in the sample file. For public data streams, the authentication library will not be needed.

## Cache Folder

The `cache` folder contains some pre-processed JSON files created using the transformation classes. The datasets provided are: 

1. Multimedia: Synthetic events to showcase the abilities of Plot-It to embed images and videos, and also deal with complex events. Examples of these complex events are given: an event covering a province/area instead a specific location, and two events linked by a path.
2. BIBLIFO
3. LGLC
4. Orlando Events

## Schemas

The Plot-It schema demostrates the format that SIMILE Exhibit expects the JSON data to be input. The Solr schema shows the format that the CWRC Solr services currently (as of January 2015) output data streams. Please see these files for details.

## SolrStreamParser

This class parses and transforms the CWRC Solr stream for a collection and creates a cached version using Plot-It schema. The class also converts a given place name into latitude-longitude coordinates using the CWRC Geonames service. Various facet labels are currently also parsed based on specific rules. Please see inline code documentation for more details.

## AuthStreamReader

This class is used to retrieve a data strea with authentication. Some CWRC Solr streams are not available to public access and can only be retrieved after authenticating to the CWRC servers. This class allows this type of authentication via PHP code and eventually retrieving the required data stream. The code uses the [PHP cURL library](http://php.net/manual/en/book.curl.php) for authentication mechanisms.  Please see inline code documentation for more details.

## Transformer

This class contains helper methods for parsing data, including legacy functions for parsing XML data streams, as the CWRC Solr services can produce XML streams as well. Please see inline code documentation for more details.

## Element

This class mimics the required fields for the Plot-It schema, and models each MODS Event as an object.

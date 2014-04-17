Local Geonames Service
======================

This geo-lookup service is built using data and principles from Geonames (www.geonames.org). You will need to install this service on your servers locally by using the following steps:

1) Create a database
2) Create the tables and import the data (more information on this is under the _datasources_ folder)
3) Call the RESTful service via http://yoururl.com/?query=Edmonton

The local service will provide a smaller set of functionalities compared with the full Geonames service, thus it is intended as a Lite version. A query to the RESTful service will return fields identical to what Geonames MEDIUM format returns, in XML, with the addition of an _asciiName_ field.
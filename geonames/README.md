Local Geonames Service
======================

This geo-lookup service is built using data and principles from Geonames (www.geonames.org). You will need to install this service on your servers locally by using the following steps:

1. Create a database
2. Create the tables and import the data (more information on this is under the _datasources_ folder)
3. Call the RESTful service via http://yoururl.com/?query=edmonton, e.g. http://apps.testing.cwrc.ca/cwrc-mtp/geonames/?query=Edmonton or http://localhost/exhibit/geonames/?query=edmonton

The local service will provide a smaller subset of functionalities compared with the full Geonames service, thus it is intended as a Lite version. A query to the RESTful service will return fields identical to what Geonames MEDIUM style returns (Geonames web service API details here: http://www.geonames.org/export/geonames-search.html), in XML, with the addition of an _asciiName_ field. The CWRC Geonames service schema (XSD) is as follows.

```xml
<xs:schema attributeFormDefault="unqualified" elementFormDefault="qualified" xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="geonames">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="geoname" maxOccurs="unbounded" minOccurs="0">
          <xs:complexType>
            <xs:sequence>
              <xs:element type="xs:string" name="name"/>
              <xs:element type="xs:string" name="asciiName"/>
              <xs:element type="xs:float" name="lat"/>
              <xs:element type="xs:float" name="lng"/>
              <xs:element type="xs:string" name="countryCode"/>
              <xs:element type="xs:string" name="countryName"/>
              <xs:element type="xs:string" name="fcl"/>
              <xs:element type="xs:string" name="fcode"/>
              <xs:element type="xs:string" name="geonameid"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>
```
## Local Geonames Service

This geo-lookup service is built using data and principles from Geonames (www.geonames.org). You will need to install this service on your servers locally by using the following steps:

1. Create a database
2. Create the tables
3. Download the full Geonames data source at http://download.geonames.org/export/dump/allCountries.zip and unzip
4. Import the data source to your database

## Creating the table

To create the necessary table in your MySQL server, run the following SQL statement. Note the use of MyISAM as the engine, this allows full text indexing.

```sql
CREATE TABLE places (
	geonameid int(11) DEFAULT NULL,
	`name` varchar(200) DEFAULT NULL,
	asciiname varchar(200) DEFAULT NULL,
	alternatenames varchar(5000) DEFAULT NULL,
	latitude decimal(10,7) DEFAULT NULL,
	longitude decimal(10,7) DEFAULT NULL,
	feature_class char(1) DEFAULT NULL,
	feature_code varchar(10) DEFAULT NULL,
	country_code char(2) DEFAULT NULL,
	cc2 char(60) DEFAULT NULL,
	admin1_code varchar(20),
	admin2_code varchar(80),
	admin3_code varchar(20),
	admin4_code varchar(20),
	population bigint(20),
	elevation int(11),
	dem int(11),
	timezone varchar(100) DEFAULT NULL,
	modification_date date DEFAULT NULL,
	UNIQUE KEY geonameid (geonameid),
	KEY `name` (`name`),
	KEY asciiname (asciiname),
	FULLTEXT KEY name_2 (`name`),
	FULLTEXT KEY asciiname_2 (asciiname)
)
ENGINE=MyISAM 
DEFAULT CHARSET=utf8;
```
	
## Importing the data source

To import the data in 'allCountries.txt' into your MySQL server, use the following command. Note that you may need to log in to your MySQL server by enabling the `--local-infile` tag, i.e. mysql -h localhost -u root -p --local-infile

```sql
LOAD DATA LOCAL INFILE 'allCountries.txt' INTO TABLE places;
```

## Usage
Once the database is ready and the PHP script files have been set, the RESTful service can be called via http://yoururl.com/?query=edmonton, e.g. http://apps.testing.cwrc.ca/cwrc-mtp/geonames/?query=Edmonton Please note that you need to update the `dbconfig.php` file to your database server configurations.

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

## RedBeanPHP

The CWRC Geonames services makes use of the third-party ORM library [RedBeanPHP](http://www.redbeanphp.com/). This library makes database querying more efficient, as well as the codebase more structured. The tested version RedBeanPHP is the release as of 2012, please consult the RedBeanPHP documentation before upgrading to ensure compatibility with the tested code.
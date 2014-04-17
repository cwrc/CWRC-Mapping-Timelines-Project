Importing Geonames Data Sources
===============================

The following files have been curated from the Geonames database (www.geonames.org), latest as of April 2014. To import these data sources into your MySQL server, follow the steps outlined below.

1) To create the necessary tables in your MySQL server, run the following SQL statements:

```sql	
-- countries table
CREATE TABLE countries (
	alpha2_code varchar(2) DEFAULT NULL,
	alpha3_code varchar(3) DEFAULT NULL,
	numeric_code int(11) DEFAULT NULL,
	fips varchar(2) DEFAULT NULL,
	`name` varchar(255) DEFAULT NULL,
	continent varchar(2) DEFAULT NULL,
	UNIQUE KEY alpha2_code_2 (alpha2_code),
	KEY alpha2_code (alpha2_code)
); 

-- cities table
CREATE TABLE cities (
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
	timezone varchar(100) DEFAULT NULL,
	modification_date date DEFAULT NULL,
	UNIQUE KEY geonameid (geonameid),
	KEY `name` (`name`),
	KEY asciiname (asciiname),
	FULLTEXT KEY name_2 (`name`),
	FULLTEXT KEY asciiname_2 (asciiname)
);
```
	
2) To import them into your MySQL server, use the following commands:

```sql
LOAD DATA LOCAL INFILE 'countries.txt' INTO TABLE 'countries';
LOAD DATA LOCAL INFILE 'cities.txt' INTO TABLE 'cities'
```
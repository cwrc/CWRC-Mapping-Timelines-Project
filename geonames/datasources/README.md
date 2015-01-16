Importing Geonames Data Source
==============================

The 'allCountries.txt' file is from the Geonames database (www.geonames.org), latest as of January 2015, and contains all the data compiled into one file. To import this file into your MySQL server, follow the steps outlined below.

1) To create the necessary table in your MySQL server, run the following SQL statement. Note the use of MyISAM as the engine, this allows full text indexing.

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
	
2) To import the data in 'allCountries.txt' into your MySQL server, use the following command. Note that you may need to log in to your MySQL server by enabling the `--local-infile` tag, i.e. mysql -h localhost -u root -p --local-infile

```sql
LOAD DATA LOCAL INFILE 'allCountries.txt' INTO TABLE places;
```

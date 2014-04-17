<?php

/** 
 * Central configuration file for specifying database connection and deployed server enviornment (development or production server)
 *
 * @author  Hamman Samuel
 * @version 20140416
 */

define("SYSMODE", "DEV"); // DEV or PROD

if (SYSMODE === "DEV")
{
    define("DBNAME", "local database name");
    define("DBUSER", "local user name");
    define("DBPASS", "local password");    
}
else if (SYSMODE === "PROD")
{
    define("DBNAME", "production database name");
    define("DBUSER", "production user name");
    define("DBPASS", "production password");
}

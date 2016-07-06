#!/usr/bin/env bash

# USAGE
#
# slicer.sh <input file> <north bounding> <east bounding> <south bounding> <west bounding>
#
# Boundings are latitudes (north & south) or longitudes (east & west) that define the area
# over which the map should display
#
# Dependencies:
#
# **imagemagick**
#    sudo apt-get install imagemagick
#
# You may need to first add the main repository:
#    sudo add-apt-repository main
#
# **gdal**
#    sudo add-apt-repository ppa:ubuntugis/ppa && sudo apt-get update
#    sudo apt-get install gdal-bin
#    sudo apt-get install python-gdal
#
#
# You may want to read http://webdesign.tutsplus.com/tutorials/the-google-maps-api-and-custom-overlays--webdesign-13868
# to get an idea of what's going on.

input_file=$1

if [ "$#" -ne 5 ]
then
  echo -e "Not enough arguments provided.\n"
  echo -e "Usage: slicer.sh <input file> <north bounding> <east bounding> <south bounding> <west bounding>\n"
  echo "Boundings are latitudes (N,S) or longitudes (E,W)"
  exit 1
fi

image_name=$(basename $input_file | cut -f 1 -d '.' | tr '[:upper:]' '[:lower:]')
output_dir="assets/images/maps/tiles/$image_name"

echo -e "Outputting to $output_dir\n"

image_width=$(identify -format "%w" $input_file)
image_height=$(identify -format "%h" $input_file)

tmp_dir=.slicer_tmp/

mkdir $tmp_dir
wgs_coord_file="$tmp_dir/wgs84.vrt"
google_maps_coord_file="$tmp_dir/google_coord.vrt"

# NS are Latitudes, EW are longitudes
bound_n=$2
bound_e=$3
bound_s=$4
bound_w=$5

echo "North: $bound_n degrees North"
echo "East: $bound_e degrees East"
echo "South: $bound_s degress North"
echo -e "West: $bound_w degrees East\n"


# inject Ground Control Points (GCPs) and export as a new file that contains that information.
#
# EPSG:4326 is the extremely common WGS84 standard (eg. LAT, LNG)
gdal_translate -of VRT -expand rgba -a_srs EPSG:4326 -gcp 0 0 $bound_w $bound_n -gcp $image_width 0 $bound_e $bound_n -gcp $image_width $image_height $bound_e $bound_s $input_file $wgs_coord_file


# Now to convert to Google's projection, otherwise it'll be wonky.
#
# EPSG:3857 is the Web Mercator standard that Google made up (aka. 900913)
gdalwarp -of VRT -t_srs EPSG:3857 $wgs_coord_file $google_maps_coord_file

# Alternative: using icky google mercator meter coordinates
#bound_n=8109796.717743561
#bound_e=196252.07012218982
#bound_s=6438749.514630105
#bound_w=-910307.6791052371
#gdal_translate -of VRT -a_srs EPSG:3857 -gcp 0 0 $bound_w $bound_n -gcp $image_width 0 $bound_e $bound_n -gcp $image_width $image_height $bound_e bounds_s $input_file $google_maps_coord_file

# --zoom means the zoom range to support in Google maps; min possible zoom is 0, max is 21
# --resume is there to avoid clobbering existing data. If the existing data is desired, delete it manually.
gdal2tiles.py --resume --profile mercator --zoom 0-8 $google_maps_coord_file $output_dir

rm -rf $tmp_dir
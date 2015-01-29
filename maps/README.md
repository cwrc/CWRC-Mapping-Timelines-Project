## Historical Maps

Plot-It supports showing historical maps as overlay. In the current code, one historical map can be toggled. More maps can easily be added as different overlays. The map provided as sample is  the John Arrowsmith 1854 map of British North America.

## Map Projection

In order to properly align the historical map with the Google Maps projection, the map has to be pre-processed and transformed into a cylindrical Web Mercator projection. This can be done by third-party software such as ArcGIS or Google Earth. The sample map of British North America was transformed from a psuedocylindrical Bonne projection.

## Alignment Coordinates

 The coordinate system assumes that the overlay image is a rectangular box. Two coordinates are needed for positioning the historical map: the top-left corner coordinate (North-West) and bottom-right corner (South-East). These coordinates are the corner edges of a virtual rectangular box that would be bounding the historical map image.
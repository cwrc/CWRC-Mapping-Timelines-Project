# Developer Notes

 * Do not pollute event objects from `CWRC.rawData()` or `CWRC.filteredData()` with widget-specific data. Doing so would clutter the data space, and may cause other widgets to fail as the events differ from their own internal stringified hash keys.
 
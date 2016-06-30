## About
Plot-It is a geo-spatial and temporal visualization tool that displays events with a temporal context (ie. date) 
and/or a spatial context (ie. location) on an interactive map and timeline. 

## Requirements

PlotIt is designed for modern browsers, including Firefox, Chome, Internet Explorer 9, 10, and Edge. An internet connection is required to load Google maps. 

## Installation & Setup

To install Plot-It, download it to a web server's application directory that supports PHP scripts. This release has been tested on the Apache server using a MySQL database. The Geonames database will also need to be set up, please see the `geonames` folder for documentation about that. Plot-It requires data in a specific JSON schema, please see the `transformers` folder for details about the schemas. Pre-processed datasets in the required schema are included with the code files. Plot-It also supports additional atlas overlays, please see the `assets/images/maps` folder for further details.

## Data 
Datafiles are linked using `<link>` tags in the document `<head>` section with `rel="cwrc/data". 

```html
<!-- Example: linking to a file called multimedia.json , in the datasets directory on the server -->
<head>
   <link href="datasets/multimedia.json" type="application/json" rel="cwrc/data" />
</head>
```

PlotIt expects JSON record data in an “items" list:

```javascript
{"items": 
    [
        // ... record definitions
    ]
}
```

Each record is a JSON object like the following: 

```javascript
{
  "label": "The short label for the record",
  "longLabel": "A longer, more detailed label for the record. ",
  "startDate": "", // Format YYYY or YYYY-MM-DD
  "endDate": "", // Optional field. Also YYYY or YYYY-MM-DD
  "location": "",  // A list of “Lat,Lng" strings 
  "description": "This is the long description. It should include details."
  // ... followed by any other fields you wish to include
},
```

Timeline & spotlight expect the fields above; if your dataset uses different field names, you must modify the 
references in the templates at the end of `index.html`. 

In the case of date/time fields, field names can be customized by providing the `data-fields` attribute to the data link with a
javascript object mapping from these canonical field names to your data's field names:
 
   * `timeStart`
   * `timeEnd` 

```html
<!-- Example: customizing the start and end fields to "startDate" and "endDate" -->
<head>
   <link href="datasets/multimedia.json" type="application/json" rel="cwrc/data" data-fields="timeStart: 'startDate', timeEnd: 'endDate'" />
</head>
```


**Map Points, Paths, and Areas**

Records that have one or more point locations provide a "latitude,longitude" point string. 

```javascript
// one location
{
  // ...
  "location": ["53.544389,-113.490927"],  // square brackets are optional for a single location
  // ... 
},
// or multiple locations
{
  // ...
  "location": ["53.544389,-113.490927", "50.454722,-104.606667"],  
  // ... 
},
```

Records that have a path must provide the `polyline` attribute with either a list of point strings, or a single string 
separated with pipe ("`|`") characters. It must also provide the `pointType` field with the value `"path"` or `"polyline"` 
(case insensitive).

```javascript
{
  // ...
  "polyline": ["53.544389,-113.490927", "50.454722,-104.606667"],  // or "53.544389,-113.490927|50.454722,-104.606667"
  "pointType": "Path"       // or "polyline" 
  // ... 
},
```

Records that have an area must provide the `polygon` attribute with either a list of point strings, or a single string 
separated with pipe ("`|`") characters. It must also provide the `pointType` field with the value `"polygon"` (case insensitive).

```javascript
{
  // ...
  "polygon": ["-109.951172,59.716253,0", "-101.777344,59.804779,0", "-101.337891,48.870135,0", "-109.687500,48.812290,0" "-109.951172,59.716253,0"],  // or "-109.951172,59.716253,0| -101.777344,59.804779,0| ... etc
  "pointType": "polygon" 
  // ... 
},
```

## Components
PlotIt provides some extensions to basic HTML in with components. Each component consists of a tag like HTML and an optional  params attribute that customizes the behaviour. 

```html
<example_component params=" "></example_component> 
```

Parameters are listed in params as a single JSON declaration; ie. a comma-separated list of parameters, where each parameter name is followed by a colon and then the javascript value.

```html
<!-- A fake component with two parameters: label and max_suggestions -->
<example_component params="label: 'Find', max_suggestions: 5"></example_component> 
```

View each component's documentation to see a description of the component, the parameters it can accept in `params`, any special conditions, and some examples of its use. All parameters are optional, except when otherwise specified. 

### `<atlas>`
A google map adorned with tokens (pins, paths, and areas) for geodata in the data set. See the Data section for how each type must be denoted in the dataset. 

If multiple pin tokens share the same location, the stack will bear the number of points in it and be given the "default" color as defined in the color table. 
Similarly, when pins are bunched together, they spread out when clicked to allow precise selection.

All of a record's tokens are grouped so that selecting one will highlight the others as well. 

**Parameters**

 * `zoom`: Zoom level as an integer. 
    * Default value: `4`
 * `center`: LatLng coordinates of the initial focus as a string. 
    * Default value: `'53.5267891,-113.5270909'` (University of Alberta)
 * `colorKey`: The data label to group by colour
 * `colors`: The mapping between values and colour. Caution: Keys are case-sensitive.
    * Colours are javascript strings of CSS colours. eg. `#33ff00` or `blue`}
 * `pinWidth`: the width in pixels of a solo pin, as an integer.
    * Default: `18`. (stack pins are scaled up automatically if needed)
 * `pinHeight`: the height in pixels of a solo pin, as an integer.
    * Default: `18`. (stack pins are scaled up automatically if needed)
 * `opacity`: the default opacity of the historical map, as a decimal between `0.0` and `1.0`

**Examples**
```html
<!-- Using the defaults --> 
<atlas></atlas>
```

```html
<!-- Customizing the starting focus, and legend colours. --> 
<atlas params="center: '38.479394673276445, -115.361328125',
             colorKey: 'person',
             colors: {'Emily Murphy': '#ff0000', 'Irene Parlby': '#00ff00', 'Nellie McClung': '#0000ff', 'Louise McKinney': 'yellow', 'Henrietta Muir Edwards': 'orange'}">
</atlas>
```

```html
<!-- Customizing many parameters --> 
<atlas params="center: '38.479394673276445, -115.361328125',
             zoom: 3,
             colorKey: 'collection',
             colors: {BIBLIFO: '#f00', Multimedia: '#0f0', OrlandoEvents: '#00f', LGLC: '#ff0'},
             opacity: '0.5',
             markerWidth: 18,
             markerHeight: 18">
</atlas>
```

### `<timeline>`
A timeline with markers at each time point in the data set. 

Records with multiple time points have all markers "linked", so that selecting one will highlight all.

**Parameters**
 * `startDate` A date string (eg. `"Jan 1 2016"`) that will be the starting focus of the timeline.
 * `zooms` The initial zoom level, as an integer, defaulting to. Providing a positive number will zoom out that many steps, and negative will zoom in.    
 * `zoomStep` A decimal number greater than `1.0` (eg. `1.1` or `3.0`) that is the factor for each step of zooming. (ie. how much it zooms each step). Defaults to `1.25` 


**Examples**
```html
<!-- Using the defaults --> 
<timeline></timeline>

<!-- Setting the initial focus, zoom level, and zoom step --> 
<timeline params="startDate: 'May 11 1988', zoom: 10, zoomStep: 1.1"></timeline>
```

### `<grid>`
A sortable table listing records and the given fields. 

**Parameters**

 * `columns` ***(Required)***: Hash of column label strings to field name strings.
 * `pageSize`: the number of items per page. 
    * Default: `20`
 * `initialSortBy`: an array of field names by which to initially sort, in order of priority. Use a suffix of `-za` to get reverse order. eg. `'author'` is forwards sorting, `'author-za'` sorts in reverse

**Styling Notes**
Columns are automatically sized, but sometimes you want to have more control or disable word-wrapping in those cells. Every grid column has a CSS class automatically added in the form based on the column name, in the format *grid-column-name*. 

eg. Column *Author* would get CSS class `grid-author`, and *First Name* gets `grid-first-name`. Every non-alphanumeric character in the column name is converted to a `-`.

**Examples**
```html
<!-- Using the defaults --> 
<grid params="columns: {'Title': 'longLabel',
                       'Collection': 'group',
                       'Location': 'location',
                       'Start Date': 'startDate',
                       'End Date': 'endDate'}"></grid>
```

```html
<!-- Defining the columns, setting the starting sort to by group then by label (Z-> A). --> 
<grid params="columns: {'Title': 'longLabel',
                       'Collection': 'group',
                       'Location': 'location',
                       'Start': 'startDate',
                       'End': 'endDate'},
             initialSortBy: ['group', 'label-za']"></grid>
```

```html
<!-- Restricting a column's wrapping rules for columns Start and End --> 
<style>
   .grid-Start, .grid-End {
       white-space: nowrap;
   }
</style>

<grid params="columns: { 'Title': 'longLabel',
                         'Collection': 'group',
                         'Location': 'location',
                         'Start Date': 'startDate',
                         'End Date': 'endDate'
                       }"></grid>
```                       
                       
### `<spotlight>`
A detailed view of a particular record. When a record is clicked in the atlas, timeline, or grid, it will become the selected record, and spotlight will automatically display its data. 

Unlike the other components, Spotlight does not change it behaviour with `params`. Instead, edit the spotlight template within the Component Templates section of the index.html file. Consult the *Knockout Bindings* section to know more about how to edit this template. 

**Parameters**
*(none)*

**Examples**
```html
<!-- Using the defaults --> 
<spotlight></spotlight>
```

### `<tab_pane>`
Wraps the content into a series of tabs. Each HTML element inside the `tab_pane` can specify its tab label with by supplying the HTML attribute `data-tab-label`, otherwise a generic tab label will be used. 

**Parameters**
*(none)*

**Examples**
```html
<!-- Settings tab labels --> 
<tab_pane>
    <div data-tab-label="First Tab">Tab 1 content</div>
    <div data-tab-label="Second Tab">Tab 2 content</div>
</tab_pane>
```

### `<expander>`
A collapsable div with toggle link. Has two styles of use: as a toggle, and as a wrapper. 

*As Wrapper*
Wraps the content with a expanding/collapsing toggle div. The content is hidden or shown when the link is clicked.

*As Toggle*
Takes an observable in parameter `expandedObservable`. It will toggle that observable between true and false state. Useful as inline toggles like in `checklist_filter`.

**Parameters**

 * `expandedObservable`: An observable to use instead of its own internal state.
 * `expandedText`: The text to display while content is expanded.
 * `collapsedText`: The text to display while the content is collapsed

**Examples**
```html
<!-- Using the defaults, controlling the visibility of some content text --> 
<expander>
   This text will show or hide. 
</expander>
```

```html
<!-- Controlling the visibility a timeline, and using custom labelling --> 
<expander params="expandedText: 'Hide Timeline', collapsedText: 'Show Timeline'">
   <timeline></timeline>
</expander>
```

### `<resizer>`
A stretchable div. Has two styles of use: as an external control, and as a wrapping control. 

*As Wrapper*
Wraps its content with a stretching viewport div and grab handle. The content is viewport is made taller/shorter when 
the handle is dragged. Child elements are reparented to the viewport. 

*As Toggle*
Takes an observable in parameter `resizerObservable`. It will update that observable with the dragged height. 
Useful when you cannot have the content be reparented (like in atlas)

**Parameters**

 * `resizerObservable`: An observable to use instead of its own internal state.
 * `resizedId`: The string of the HTML element id for the DOM element to resize.  

**Examples**
```html
<!-- Using the defaults, controlling the area of some content --> 
<expander>
   This area is stretchy.
</expander>
```

```html
<!-- Controlling the area of a atlas using the atlas's internal 'canvasHeight' observable --> 
<atlas id="atlas_canvas"></atlas>
<resizer params="resizerObservable: canvasHeight, resizedId: 'atlas_canvas'"></resizer>
```

### Filters
#### `<text_filter>`
Filters the dataset when any text is inputted, immediately after typing is completed. It searches all fields for the requested text. 

**Parameters**

 * `label`: The label to display
    * Default value: `'Search'`
 * `placeholder`: The greyed out prompt text
    * Default value: `'eg. University of Alberta'`

**Examples**
```html
<!-- Using the default label and placeholder text --> 
<text_filter></text_filter>
```

```html
<!-- Customizing the label --> 
<text_filter params="label: 'Find'"></text_filter>
```

```html
<!-- Customizing both label and placeholder --> 
<text_filter params="label: 'Find', placeholder: 'eg. Edmonton'"></text_filter>
```

#### `<date_filter>`
A dual-slider that filters the dataset by the fields `startDate` and `endDate`. 

***Caution***: requires that the data fields be named `startDate` (and `endDate`, if applicable).

**Parameters**

 * `label`: The label to display
    * Default value: `'Date range'`

**Styling Filters**
This component uses the [nouislider.js](http://refreshless.com/nouislider/) library to build the mutl-handle widget. See http://refreshless.com/nouislider/more/#section-styling for instructions on how to best style it. 

**Examples**
```html
<!-- Using the default label --> 
<date_filter></date_filter>
```

```html
<!-- Customizing the label --> 
<date_filter params="label: 'Timespan'"></date_filter>
```

#### `<checklist_filter>`
Produces a list of values for the provided facet field the dataset. If any value is checked, then the dataset is filtered to only include the records that have that value in the facet field. 

**Parameters**

 * `field` ***(required)***: The object field to group as a facet, as a javascript string (ie. within single quotes)
 * `label`: The label to display  
    * Default value: `'Property: '` + *(field value)*, eg. `Property: Name`

**Examples**
```html
<!-- Using the default label and grouping all data records by the field 'author' --> 
<checklist_filter params="field: 'author'"></checklist_filter>
```

```html
<!-- Customizing the label --> 
<checklist_filter params="label: 'Collection', field: 'collectionName'"></checklist_filter>
```

#### `<filter_save_results>`
A simple button that opens a dialog to save the filtered results. There are a few format options to choose from:

* **JSON** produces a `.json` file containing a filtered subset of your original JSON dataset
* **CSV** produces a `.csv` file where:
    * the first line contains the field names separated by the *separator* character,  
    * every following line is a data entry whose data is separated by the *separator* character, 
    * the separator (either `,` `;` `\t` or `|`) is chosen based on the first that does not appear in the data
* **XML** produces a `.xml` file containing an XML representation of the data. 

*Note:* Some very old browsers will append a `.txt` file extension for all files. This can only be worked 
around by upgrading to a modern browser. 

**Parameters**

*(none)*

**Examples**
```html
<!-- Saves filtered results --> 
<filter_save_results></filter_save_results>
```

#### `<filter_reset>`
A simple button that resets all of the associated filters to their default state. To associate filters with a reset button, nest them all into the same `<div>` HTML element, and give that `<div>` a unique HTML id. Provide that id name as a `<filter_reset>` parameter.

**Parameters**

 * `filterGroupId` ***(required)***: The HTML id of the div containing the filters
 * `label`: The label to display  
    * Default value: `'Reset All'`

**Examples**
```html
<!-- An example filter group --> 
<div id="filters">
   <text_filter></text_filter>
</div>
```

```html
<!-- Resets all filters in the 'filters' div --> 
<filter_reset params="label: 'Reset All', filterGroupId: 'filters'"></filter_reset>
```

```html
<!-- Changing the label --> 
<filter_reset params="label: 'Reset All', filterGroupId: 'filters'"></filter_reset>
```

## Knockout Bindings
Knockout uses the `data-bind` HTML attribute to know what to modify. Simply provide a list of bindings in that attribute. The most common and relevant bindings are outlined here. See the developer's section for a more technical description of Knockout and its use. 

| Binding | Short Description                                                                           |
|---------|---------------------------------------------------------------------------------------------|
| html    | Will produce HTML markup into the HTML element                                              |
| text    | Like HTML binding, but will produce raw text (ie. will not interpret HTML tags)             |
| foreach | Will repeat the content for every element in the given list. Within that HTML element, `$data` refers to the individual item each round.   | 
| visible | This HTML element will be visible when when the javascript expression is a truthy value. |
| if      | Similar to `visible`, but instead of hiding the element with CSS rules, it literally removes the element from the page. This has performance & logic implications, so use `visible` when possible.   | 

## Styling
The page overall has its style defined in `assets/styles/plot_it.css` and each component has its own style sheet in the `assets/styles/components/*` directory. 

When styling a component, it is recommended to use the component's tag as part of every selector, to avoid accidental name collisions. See a component's individual reference section for details about it.
 
## For Developers
### Knockout
[Knockout](http://knockoutjs.com/documentation/introduction.html) is a lightweight Javascript MVVM library. Constructed around the Decorator and Observer patterns, it's essentially a really convenient way to update the page content dynamically. 

**Components**
We are using the Component Model style of knockout, which is a relatively more recent advancement in the library. Components bundle together two parts, a Template and a View Model, into a custom HTML tag. 

The template defines what the component's HTML looks like and binds handlers, located in the View Model, to parts of that HTML definition. The View Model in turn, collects together a series of data and functions used to populate the Template. 

Components registrations should be kept to assets/javascripts/components/. The templates are in index.html or are in-place as a javascript string. It would be better if they could be kept in a separate HTML file and included, but that's a serverside injection issue. 

**Observables**
Data that is expected to change is stored in an [observable](http://knockoutjs.com/documentation/observables.html#observables) wrapper object. When the value of that observable changes, anything that references it in a binding will update. Lists behave very similarly, but are stored in [observableArrays](http://knockoutjs.com/documentation/observableArrays.html) instead. 

Because it's a wrapper, initializing, setting, and retrieving an observable is slightly different:

```javascript
// 'self' here refers to the ViewModel
// create an observable to hold the “name" value
self.name = ko.observable() 

self.name('Bob')     // sets the name to Bob. 
self.name            // this is the observable itself (ie. the wrapper)
self.name()          // this retrieves the value from the observable
```

You omit the parentheses in direct bindings, because it's binding to the observable, not the value. Similarly, omit the this or self, because it's already looking on that object:

<span data-bind="text: name"></span>

**Computed Observables**
When a value is to be dynamically computed based on data in observables, use pureComputed/computed observables. These will recalculate their value whenever any observable they use in their 

**`index.html` Header**
The order of the includes doesn't matter except that this partial ordering must be preserved: 

 1. libraries (ie, knockout, google maps, spiderfy, and noUiSlider)
 2. component definitions
 3. plot_it.js 

### File layout 
Details about the file layout and directory intents can be found in the readme-s within those locations. 

`assets/`
For view-related files delivered by the web server. This includes at minimum javascript, CSS, and images. 

`datasets/`
Data used in the view. These are JSON files that contain the actual records to be displayed. While delivered to the client browser, datasets are not assets because they are displayed, not doing the displaying. 

### Data Freeze
Source records are under [`Object.freeze()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) to prevent bugs and data-pollution. If you need to store widget-related data paired with records, do so with a hash, using `ko.toJSON(...)`.


## Credits
Plot-It's interface was developed by [Tenjin Inc.](http://tenjin.ca) and is written in Javascript with [Knockout JS](http://knockoutjs.com/), [noUISlider](http://refreshless.com/nouislider/), and [Google Maps API](https://developers.google.com/maps/). 

The PHP server implementation was written by [CWRC](http://www.cwrc.ca/en/) staff, including Jeffery Antoniuk, Michael Brundin, and Hamman Samuel.  

## Contact Us

For further information, contact Susan Brown (sibrown@ualberta.ca), CWRC Project Leader.
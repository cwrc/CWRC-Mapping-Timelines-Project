# Developer Notes

 * Source data is under [`Object.freeze()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) 
 to prevent bugs and data-pollution. If you need to store widget-related data, do so with a hash, using `ko.toJSON(...)`. 
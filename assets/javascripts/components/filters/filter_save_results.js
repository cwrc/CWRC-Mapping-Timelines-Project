ko.components.register('filter_save_results', {
    template: '<input type="button" data-bind="value: \'Save Results...\', click: function(){ save() }"/>',

    /**
     */
    viewModel: function () {
        var self = this;

        self['save'] = function () {
            var data;

            data = JSON.stringify(CWRC.filteredData());

            self.triggerDownload('results.json', 'application/json', data);
            //self.triggerDownload('text/csv', data);
            //self.triggerDownload('application/json', data); // json-LD
            //self.triggerDownload('application/xml', data); //
        };

        self['triggerDownload'] = function (name, mime, data) {
            /**
             * I'm not a big fan of library bloat, especially those that add global garbage like this,
             * but at the time of writing, the support for Blobs and the FileSystem API is too spotty.
             * FileSaver.js seems to be the only independent solution with roughly broad support.
             *
             * Data URIs don't seem to always work for large datasets, otherwise that would be preferred.
             *
             * - Robin Miller
             */
            saveTextAs(data, name);
        }
    }
})
;
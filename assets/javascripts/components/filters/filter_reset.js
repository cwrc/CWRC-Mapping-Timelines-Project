ko.components.register('filter_reset', {
    template: '<input type="button" data-bind="value: label, click: function(){ resetFilters() }"/>',

    /**
     * Parameters:
     * @param filterGroupId: The HTML id of the container around the filters. (required)
     * @param label: The label to display
     */
    viewModel: function (params) {
        var self = this;

        self.label = params['label'] || 'Reset All';

        self.filterGroupId = params['filterGroupId'] || alert("Error: You must provide the 'filterGroupId' parameter to <filter_reset>.");

        self['resetFilters'] = function () {
            var filter, filterGroup, children, child, filters, filterModel;

            filterGroup = document.getElementById(self.filterGroupId);

            filters = filterGroup.querySelectorAll('text_filter, date_filter, checklist_filter');

            CWRC.groupHistory('Reset Filters', function () {
                for (var i = 0; i < filters.length; i++) {
                    filter = filters[i];

                    // doing this query for all eliminates text nodes, which aren't mapped in dataFor
                    filterModel = ko.dataFor(filter.querySelector('*'));

                    filterModel.reset();
                }
            });
        };
    }
});
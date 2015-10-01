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
            var filter, filterGroup, children, child;

            filterGroup = document.getElementById(self.filterGroupId);
            children = filterGroup.childNodes;

            for (var i = 0; i < children.length; i++) {
                child = children[i];

                if (child.nodeType === 1) {
                    filter = ko.dataFor(child.childNodes[0]);

                    filter.reset();
                }
            }
        };
    }
});
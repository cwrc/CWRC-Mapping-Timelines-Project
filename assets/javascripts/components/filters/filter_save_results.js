ko.components.register('filter_save_results', {
    template: '<input type="button" data-bind="value: \'Save Results...\', click: function(){ save() }"/>',

    /**
     */
    viewModel: function () {
        var self = this;

        self['save'] = function () {
            alert('save')
        };
    }
})
;
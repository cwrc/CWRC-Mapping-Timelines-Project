ko.components.register('text_filter', {
    template: '<header>\
                    Search\
                    <a href="#" data-bind="click: function(){ enabled(!enabled()) }, text: enableText"></a>\
               </header>\
               <input type="search" placeholder="eg. Rocky Mountains" data-bind="textInput: filterText, enable: enabled"/>',

    viewModel: function (params) {
        var self = this;

        self.enabled = ko.observable(true);
        self.enableText = ko.pureComputed(function () {
            return self.enabled() ? 'disable' : 'enable';
        });

        // Using timeouts to throttle the filtering, otherwise it becomes sluggish
        self.filterText = ko.observable('').extend({method: 'notifyWhenChangesStop', rateLimit: 300 });

        self['filter'] = function (item) {
            if (!self.enabled())
                return true;

            var filterText = self.filterText().toLowerCase();

            for (var field in item) {
                if (item.hasOwnProperty(field)) {
                    var value = item[field].toString().toLowerCase();

                    return value.indexOf(filterText) >= 0;
                }
            }

            return false;
        };

        CWRC.filters.push(self['filter']);
    }
});
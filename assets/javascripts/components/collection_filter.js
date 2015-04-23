ko.components.register('collection_filter', {
    template: '<header>Collection</header>\
               <div data-bind="foreach: collections">\
                    <label>\
                        <span data-bind="text: $data"></span>\
                        <input type="checkbox" placeholder="eg. Rocky Mountains" data-bind="attr: {value: $data}, checked: $parent.selected"/>\
                    </label>\
               </div>',

    viewModel: function (params) {
        var self = this;

        self.collections = params.collections || [];
        self.selected = ko.observableArray();

        self.filter = ko.computed(function () {
            // TODO: actually filter
            if (self.selected().length > 0)
                alert('filtering collection ' + self.selected());
        });
    }
});
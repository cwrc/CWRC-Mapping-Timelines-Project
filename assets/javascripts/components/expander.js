ko.components.register('expander', {
    template: '<a href="#" data-bind="click: function(){ isVisible(!isVisible()) }">\
                    <span data-bind="text: labelText"></span>\
                    <span data-bind="text: labelArrow"></span>\
               </a>\
               <div data-bind="visible: isVisible, template: {nodes: content}">\
               </div>',

    /**
     * A loading overlay throbber.
     */
    viewModel: {
        // See http://knockoutjs.com/documentation/component-custom-elements.html#passing-markup-into-components
        // for why this is a little different from most components
        createViewModel: function (params, componentInfo) {
            var SwitcherModel = function (params, content) {
                var self = this;

                self.content = content;
                self.isVisible = params['visibilityObservable'] || ko.observable(true);

                self.expandedText = (params['expandedText'] || 'Hide');
                self.collapsedText = (params['collapsedText'] || 'Show');

                self.expandedArrow = '\u25Be';
                self.collapsedArrow = '\u25B4';

                self.labelText = ko.computed(function () {
                    return self.isVisible() ? self.expandedText : self.collapsedText;
                });

                self.labelArrow = ko.computed(function () {
                    return self.isVisible() ? self.expandedArrow : self.collapsedArrow;
                });
            };

            return new SwitcherModel(params, componentInfo.templateNodes);
        }
    }
});
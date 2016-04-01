ko.components.register('expander', {
    template: '<a href="#" data-bind="click: function(){ isVisible(!isVisible()) }">\
                    <!-- This display inline-block fixes a dirty-rendering problem in chrome --> \
                    <span style="display: inline-block " data-bind="html: labelText"></span>\
                    <span data-bind="html: labelArrow"></span>\
               </a>\
               <div class="expander-content" data-bind="style: {\'max-height\': height, \
                                                                \'-webkit-transition-duration\': transitionDuration + \'ms\',\
                                                                \'-moz-transition-duration\': transitionDuration + \'ms\',\
                                                                \'transition-duration\': transitionDuration + \'ms\'}, \
                                                        template: {nodes: content}">\
               </div>',

    // See http://knockoutjs.com/documentation/component-custom-elements.html#passing-markup-into-components
    // for why this is a little different from most components
    viewModel: {
        createViewModel: function (params, componentInfo) {
            /**
             * An expandable/collapsable pane that toggles between states.
             *
             * @param params
             *        - expandedObservable: An observable to use instead of its own internal state.
             *        - expandedText: The text to display while content is expanded.
             *        - collapsedText: The text to display while the content is collapsed
             * @param content the content to expand and collapse
             * @param domElement the DOM node that this component is bound to
             * @constructor
             */
            var ExpanderModel = function (params, content, domElement) {
                var self = this;

                self.content = content;
                self.isVisible = params['expandedObservable'] || ko.observable(true);

                self.transitionDuration = 250; //ms

                self.expandedText = (params['expandedText'] || 'Hide');
                self.collapsedText = (params['collapsedText'] || 'Show');

                self.expandedArrow = '\u25Be';
                self.collapsedArrow = '\u25B4';

                self.expanderContentDiv = domElement.querySelector('.expander-content');

                self.labelText = ko.computed(function () {
                    return self.isVisible() ? self.expandedText : self.collapsedText;
                });

                self.labelArrow = ko.computed(function () {
                    return self.isVisible() ? self.expandedArrow : self.collapsedArrow;
                });

                // CSS Transitions require the height be set explicitly on both before and after, and 'auto' isn't explicit.
                self.isVisible.subscribe(function (oldValue) {
                    self.height(oldValue ? self.expanderContentDiv.scrollHeight : 0);
                }, null, 'beforeChange');

                self.isVisible.subscribe(function (newValue) {
                    // need to use timeout to push this down the event stack to allow the rendering engine to update properly
                    window.setTimeout(function () {
                        self.height(newValue ? self.expanderContentDiv.scrollHeight : 0)
                    }, 0);

                    // clearing the content max height allows for the content to size auto again
                    window.setTimeout(function () {
                        if (self.height() > 0)
                            self.height('')
                    }, self.transitionDuration + 10)
                });

                self.height = ko.observable();
            };

            return new ExpanderModel(params, componentInfo.templateNodes, componentInfo.element);
        }
    }
});
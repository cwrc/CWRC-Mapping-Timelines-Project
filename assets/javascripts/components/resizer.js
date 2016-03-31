ko.components.register('resizer', {
    template: ' <div class="viewport" data-bind="style:{height: viewportSize}, template: {nodes: content}">\
                </div>\
                <div class="pull-bar" data-bind="html: arrow, event: {mousedown: onMouseDown}">\
               </div>\
               ',
    viewModel: {
        // See http://knockoutjs.com/documentation/component-custom-elements.html#passing-markup-into-components
        // for why this is a little different from most components
        createViewModel: function (params, componentInfo) {
            /**
             * A resizeable pane that controls the height of its viewport.
             *
             * @param params (none)
             * @param content the content to expand and collapse
             * @constructor
             */
            var ResizerModel = function (params, content) {
                var self = this;

                self.content = content;

                self.arrow = '\u25Be';
                self.lastY = null;

                self.viewportSize = ko.observable(); // px

                self['onMouseDown'] = function (viewModel, event) {
                    self.lastY = event.pageY;

                    // this will need to change if the DOM order changes
                    self.viewportSize(event.target.previousElementSibling.offsetHeight);
                };

                window.addEventListener('mousemove', function (event) {
                    if (self.lastY && event.buttons == 1) {
                        var delta = event.pageY - self.lastY;

                        self.viewportSize(self.viewportSize() + delta);

                        self.lastY = event.pageY;
                    }
                });

                window.addEventListener('mouseup', function (event) {
                    self.lastY = null;
                });
            };

            return new ResizerModel(params, componentInfo.templateNodes);
        }
    }
});
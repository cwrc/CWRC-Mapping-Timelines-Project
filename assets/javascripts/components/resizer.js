ko.components.register('resizer', {
    template: ' <div class="viewport" data-bind="visible: isInternal, style:{height: viewportSize}, template: {nodes: content}">\
                </div>\
                <div class="pull-bar" data-bind="html: arrow, event: {mousedown: onMouseDown}">\
               </div>\
               ',
    viewModel: {
        // See http://knockoutjs.com/documentation/component-custom-elements.html#passing-markup-into-components
        // for why this is a little different from most components
        createViewModel: function (params, componentInfo) {
            /**
             * A resizeable pane that controls the height of its viewport. Use resizerObservable and resizedId to control
             * a DOM element that isn't a child of the resizer
             *
             * @param params
             *        - resizerObservable: An observable to use instead of its own internal state.
             *        - resizedId: The id of the external element that this widget controls.
             * @param content the content to expand and collapse
             * @constructor
             */
            var ResizerModel = function (params, content) {
                var self = this;

                self.content = content;

                self.arrow = '\u25Be';
                self.lastY = null;

                self.isInternal = !params.resizerObservable;
                self.viewportSize = params.resizerObservable || ko.observable(); // px

                self['onMouseDown'] = function (viewModel, event) {
                    self.lastY = event.pageY;

                    // this will need to change if the DOM order changes
                    if (self.isInternal)
                        self.viewportSize(event.target.previousElementSibling.offsetHeight);
                    else
                        self.viewportSize(document.getElementById(params.resizedId).offsetHeight)
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
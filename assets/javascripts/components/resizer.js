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
             * @param componentInfo component context information
             * @constructor
             */
            var ResizerModel = function (params, componentInfo) {
                var self = this;

                self.arrow = '\u25Be';
                self.lastY = null;

                self.content = componentInfo.templateNodes;

                self.isInternal = self.content.some(function (node) {
                    return [Node.ELEMENT_NODE, Node.DOCUMENT_NODE, Node.DOCUMENT_FRAGMENT_NODE].indexOf(node.nodeType) >= 0;
                });
                self.viewportSize = params.resizerObservable || ko.observable(); // px

                // better to use the natural size as a default, rather than some probably-wrong constant.
                if (self.isInternal)
                    self.viewportSize(componentInfo.element.querySelector('.viewport').offsetHeight);
                else
                    self.viewportSize(document.getElementById(params.resizedId).offsetHeight);

                self['onMouseDown'] = function (viewModel, event) {
                    self.lastY = event.pageY;
                };

                window.addEventListener('mousemove', function (event) {
                    if (self.lastY && event.buttons == 1) {
                        var delta = event.pageY - self.lastY;

                        self.viewportSize(Math.max(self.viewportSize() + delta, 0));

                        self.lastY = event.pageY;
                    }
                });

                window.addEventListener('mouseup', function (event) {
                    self.lastY = null;
                });
            };

            return new ResizerModel(params, componentInfo);
        }
    }
});
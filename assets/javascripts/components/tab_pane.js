ko.components.register('tab_pane', {
    template: {element: 'tab-pane-template'},
    viewModel: {
        // See http://knockoutjs.com/documentation/component-custom-elements.html#passing-markup-into-components
        // for why this is a little different from most components
        createViewModel: function (params, componentInfo) {
            var SwitcherModel = function (params, panelNodes) {
                var self = this;

                self.views = panelNodes;

                // switcher state
                self.currentView = ko.observable(0);

                self['setView'] = function (name) {
                    self.currentView(name);
                };

                self['isView'] = function (name) {
                    return self.currentView() == name;
                };

                self['tabName'] = function (node, index) {
                    return node.getAttribute('data-tab-label') || 'Tab ' + (index + 1)
                }
            };

            var switchableNodes;

            switchableNodes = componentInfo.templateNodes.filter(function (node) {
                return node.nodeType == Node.ELEMENT_NODE;
            });

            return new SwitcherModel(params, switchableNodes)
        }
    }
});
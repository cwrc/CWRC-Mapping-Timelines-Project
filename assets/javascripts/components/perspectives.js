ko.components.register('perspectives', {
    template: '<div data-bind="if: currentUser()" >\
                    <nav>\
                        <!-- ko foreach: navViews -->\
                            <a data-bind="click: $parent.navClick, attr: {href: $data}">\
                                <span data-bind="text: $parent.views.get($data).name()"></span>\
                            </a>\
                        <!-- /ko -->\
                    </nav>\
                    <!-- ko if: currentView()-->\
                        <div id="perspectiveContainer" data-bind="dynamicHtml: currentView().component()"></div>\
                    <!-- /ko -->\
                </div>\
                <!-- ko ifnot: currentUser() -->\
                    <sign_in></sign_in>\
                <!-- /ko -->',
    viewModel: function () {
        var self = this;

        // States
        self.views = {
            get: function (path) {
                // These keys are regex-as-strings
                var viewmap = {
                    '^/?$|/?referrals': {
                        component: ko.observable('<referrals></referrals>'),
                        name: function () {
                            return  "My Referrals";
                        }
                    }, '/?advise': {
                        component: ko.observable('<advisor></advisor>'),
                        name: function () {
                            return "Advise New Referral";
                        }
                    }, '/?referral': {
                        component: function () {
                            return '<referral params="id: ' + History.getState().data.id + '"></referral>';
                        },
                        name: function (state) {
                            return state.name;
                        }
                    }
                };

                for (var key in viewmap) {
                    if (viewmap.hasOwnProperty(key) && path.match(key))
                        return viewmap[key];
                }
            }
        };

        self.navViews = ['/referrals', '/advise'];

        self.currentView = ko.observable(self.views.get(location.pathname));

        // ooo la la!
        self.dirtyMessage = 'You will lose unsaved data if you continue.';

        // 1. On load (refresh or direct address), unpack all data from the path.
        //        a. Slashes become the widget name,
        //        b. location.search becomes packed as a hash.
        //        c. Both are packed into the history data.
        // 2. When history changes, switch this perspective to render the component with that name

        // Behaviour
        (function (window, undefined) {
            // Note: We are using statechange instead of popstate
            // Note: We are using History.getState() instead of event.state
            History.Adapter.bind(window, 'statechange', function () {
                self.currentView(self.views.get(location.pathname));
            });

            // Need this to show a dialog at all in unload event.
            window.addEventListener("beforeunload", function (event) {
                if (ko.hasUnsavedChanges())
                    event.returnValue = self.dirtyMessage;
            });
        })(window);

        window['visit'] =
            self['visit'] = function (path, paramHash) {
                if (!ko.hasUnsavedChanges() || confirm(self.dirtyMessage)) {
                    ko.clearTracking();

                    paramHash = paramHash || {};

                    History.pushState(paramHash,
                            self.views.get(path).name(paramHash) + " - Nephrology",
                            path + serializeSearch(paramHash));
                }
            };

        self['navClick'] = function (path, event) {
            if (event.button == 0)
                self.visit(path);
            else {
                return true;
            }
        };

        var paramHash = deserializeSearch();
        History.replaceState(paramHash, self.currentView().name(paramHash) + " - Nephrology", location.pathname + location.search);
        document.title = self.currentView().name(paramHash) + " - Nephrology";
    }
});

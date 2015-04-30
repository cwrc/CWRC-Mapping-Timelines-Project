ko.components.register('spotlight', {
    template: '<section data-bind="if: selected() == null, visible: selected() == null">\
                    <p class="placeholder">\
                        Click an event in the timeline or map to see details\
                    </p>\
               </section>\
               <section data-bind="if: selected() != null, visible: selected() != null">\
                    <!-- TODO: this -->\
                    <img data-bind="visible: selected().images, attr: {src: selected().images}"/>\
                    <iframe height="150" height="150" allowfullscreen=true data-bind="visible: selected().videos, attr: {src: selected().videos}">\
                    </iframe>\
                    <div>\
                        <header>\
                            <span data-bind="if: selected().startDate">\
                                <span data-bind="text: selected().startDate"></span>\
                                <span data-bind="if: selected().endDate">\
                                    to\
                                    <span data-bind="text: selected().endDate"></span>\
                                </span>\
                            </span>\
                            <span data-bind="if: selected().location">\
                                <span data-bind="text: selected().location"></span>\
                            </span>\
                        </header>\
                        <section>\
                            <header>\
                                <span data-bind="text: selected().longLabel"></span>\
                            </header>\
                            <span data-bind="html: selected().description"></span>\
                            <p data-bind="if: selected().urls">\
                                <a target="_blank" data-bind="attr:{ href: selected().urls }">More...</a>\
                            </p>\
                            <p data-bind="if: selected().source">\
                                <a target="_blank" data-bind="attr:{ href: selected().source}">(Source)</a>\
                            </p>\
                        </section>\
                    </div>\
               </section>',
// selected().startDate

    // TODO: simplify API by removing selected() and dynamically finding the field
    // TODO: provide an HREF binding for links, src binding for images/iframes
    // TODO: may want to see if we can fail noisier. Academics won't check the console.
    viewModel: function () {
        var self = this;

        // switcher state
        self.selected = CWRC.selected;

        self['has'] = function (field) {
            return !!self.selected()[field];
        }
    }
});
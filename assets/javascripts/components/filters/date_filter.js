ko.components.register('date_filter', {
    template: '<div ><!--TODO: histogram, probably KO component-->\
               </div>\
               <div id="time_filter" type="range" ></div>',

    viewModel: function (params) {
        var self = this;

        var slider = document.getElementById('time_filter');

        // TODO: actually set these to the real time ranges
        // TODO: actually use this to set some values for filtering.
        noUiSlider.create(slider, {
            start: [0, 100],
            connect: true,
            range: {
                'min': 0,
                'max': 100
            }
        });

        self.dismissable = ko.observable(params.dismissable || false);

        self.notices = params.notices || ko.observableArray([]);
        self.warnings = params.warnings || ko.observableArray([]);
        self.errors = params.errors || ko.observableArray([]);

        // the text below the warnings, describing it
        self.warningFlavour = ko.observable(params.warningFlavour);

        self.hasMessages = function () {
            return self.notices().length > 0 ||
                self.warnings().length > 0 ||
                self.errors().length > 0;
        }
    }
});
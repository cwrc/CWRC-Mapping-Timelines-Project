ko.components.register('loading_overlay', {
    template: '<div class="overlay" data-bind="visible: isLoading">\
                    <p data-bind="text: loadingMessage">\
                    </p>\
               </div>',

    /**
     * A loading overlay throbber.
     */
    viewModel: function (params) {
        var self = this;

        self.isLoading = CWRC.isLoading;

        self.numberOfDots = ko.observable(0);
        self.loadingMessage = ko.computed(function () {
            var dots = [];

            while (dots.length <= (self.numberOfDots() % 4) - 1) {
                dots.push('.');
            }

            return 'Loading' + dots.join('');
        });

        self.cycleDots = function(){
            self.interval = window.setInterval(function () {
                self.numberOfDots(self.numberOfDots() + 1);
            }, 500);
        };

        self.isLoading.subscribe(function (newVal) {
            if (newVal)
                window.clearInterval(self.interval)
            else {
                self.cycleDots();
            }
        });

        self.cycleDots();
    }
});
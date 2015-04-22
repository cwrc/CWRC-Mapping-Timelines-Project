// KnockoutJS Unsaved Change Tracking Extension
//
// Author: Robin Miller, Tenjin Inc.
// Recognition to David Freire and Brett Green for the original change detection code
// (via http://stackoverflow.com/questions/10622707/detecting-change-to-knockout-view-model)

(function (window, undefined) {
    ko.trackedModels = ko.observableArray([]);

    ko.extenders.trackChange = function (target, track) {
        if (track) {
            target.originalValue = target();

            target['isDirty'] = function () {
                return target() != target.originalValue
            };
        }
        return target;
    };

    // Takes the viewmodel and, optionally, the field name to be tracked.
    // Use the second parameter to limit what gets tracked.
    ko['track'] = function (model, fieldName) {
        ko.trackedModels.push(model);

        var data;

        if (fieldName)
            data = model[fieldName];
        else
            data = model;

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                if (ko.isObservable(data[key])) {
                    data[key].extend({ trackChange: true });
                } else if (typeof data[key] === 'object') {
                    ko.track(data[key]);
                }
            }
        }
    };

    ko['clearTracking'] = function () {
        var newModels = [];

        // TODO: only keep those who are not children of a given component
//        for (var i = 0; i < ko.trackedModels().length; i++) {
//            var model = ko.trackedModels()[i];
//
//            if (model.parents.indexOf(self) < 0) {
//                newModels.push(model);
//            }
//        }

        ko.trackedModels(newModels);
    };

    ko['hasUnsavedChanges'] = function () {
        var isDirty = false;

        for (var i = 0; i < ko.trackedModels().length; i++) {
            var model = ko.trackedModels()[i];

            if (ko.isDirty(model)) {
                return true;
            }
        }

        return false;
    };

    ko['isDirty'] = function (model) {
        for (key in model) {
            if (model.hasOwnProperty(key)) {
                var property = model[key];

                if (ko.isObservable(property)
                    && typeof property.isDirty === 'function' && property.isDirty()) {

                    return true;
                } else if (typeof property === 'object') {
                    return ko.isDirty(property);
                }
            }
        }
        return false;
    };
}(window));
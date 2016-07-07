ko.components.register('filter_save_results', {
    template: ' <input type="button" data-bind="value: \'Save Results...\', click: toggleDialog"/>\
                <div class="save-dialog" data-bind="visible: dialogVisible, click: toggleDialog">\
                    <div data-bind="click: function(){}, clickBubble: false">\
                        <header>Download As</header>\
                        <input type="button" data-bind="value: \'JSON\', click: function(){ saveJSON() }"/>\
                        <input type="button" data-bind="value: \'JSON-LD\', click: function(){ saveJSONLD() }"/>\
                        <input type="button" data-bind="value: \'CSV\', click: function(){ saveCSV() }"/>\
                        <input type="button" data-bind="value: \'XML\', click: function(){ saveXML() }"/>\
                        <hr>\
                        <input type="button" data-bind="value: \'Cancel\', click: toggleDialog"/>\
                    </div>\
                </div>',

    /**
     */
    viewModel: function () {
        var self = this;

        self.dialogVisible = ko.observable(false);

        self['toggleDialog'] = function () {
            self.dialogVisible(!self.dialogVisible());
        };

        self['saveJSON'] = function () {
            self.triggerDownload('results.json', 'application/json', JSON.stringify(CWRC.filteredData()));
        };

        self['saveJSONLD'] = function () {
            self.triggerDownload('results.jsonld', 'application/json', JSON.stringify(CWRC.filteredData()));
        };

        self['saveCSV'] = function () {
            var headers, lines, line, csv, fileContent;

            headers = [];

            csv = {
                separatorOptions: [',', ';', '\t', '|'],
                separatorId: 0,
                separator: function () {
                    return this.separatorOptions[this.separatorId];
                },
                next: function () {
                    this.separatorId++;
                },
                separatorError: function () {
                    return this.separatorId >= this.separatorOptions.length
                }
            };

            // Need to collect all possible headers separately so that we capture all entries in correct order
            CWRC.filteredData().forEach(function (item) {
                Object.keys(item).forEach(function (key) {
                    if (headers.indexOf(key) < 0)
                        headers.push(key)
                });
            });

            lines = [headers];

            CWRC.filteredData().forEach(function (item) {
                lines.push(headers.map(function (key) {
                    if (item[key] && item[key].indexOf(csv.separator()) >= 0)
                        csv.next();

                    return item[key] || '';
                }));
            });

            fileContent = lines.reduce(function (lines, line) {
                lines.push(line.join(csv.separator()));
                return lines;
            }, []).join('\n');

            if (csv.separatorError()) {
                alert('Cannot save as CSV. All possible separators ("' + csv.separatorOptions.join('" "') + '") are contained in the data.')
            } else {
                self.triggerDownload('results.csv', 'text/csv', fileContent);
            }
        };

        self['saveXML'] = function () {
            var lines, tag, value;

            lines = ['<items>'];

            sanitize = function (str) {
                return (str || '').replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&apos;')
            };

            CWRC.filteredData().forEach(function (item) {
                lines.push('<item>');

                Object.keys(item).forEach(function (key) {
                    tag = sanitize(key).replace(/\s/, '_');
                    value = item[key];

                    if (value instanceof Array) {
                        lines.push('<' + tag + '>');

                        value.forEach(function (innerValue) {
                            lines.push(
                                '<' + self.singularize(tag) + '>' +
                                sanitize(innerValue) +
                                '</' + self.singularize(tag) + '>');
                        });

                        lines.push('</' + tag + '>')
                    } else {
                        lines.push(
                            '<' + tag + '>' +
                            sanitize(value) +
                            '</' + tag + '>');
                    }
                });

                lines.push('</item>')
            });

            lines.push('</items>');

            self.triggerDownload('results.xml', 'application/xml', lines.join('\n')); //
        };

        self['singularize'] = function (str) {
            if (str.lastIndexOf('s') == str.length - 1)
                return str.substring(0, str.length - 1);
            else
                return str + '_element>';
        };

        self['triggerDownload'] = function (name, mime, data) {
            /**
             * I'm not a big fan of library bloat, especially those that add global garbage like this,
             * but at the time of writing, the support for Blobs and the FileSystem API is too spotty.
             * FileSaver.js seems to be the only independent solution with roughly broad support.
             *
             * Data URIs don't seem to always work for large datasets, otherwise that would be preferred.
             *
             * - Robin Miller
             */
            saveTextAs(data, name);

            self.dialogVisible(false);
        }
    }
});
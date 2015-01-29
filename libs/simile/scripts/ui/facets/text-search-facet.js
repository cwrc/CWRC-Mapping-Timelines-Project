/*==================================================
 *  Exhibit.TextSearchFacet
 *==================================================
 */

Exhibit.TextSearchFacet = function(containerElmt, uiContext) {
    this._div = containerElmt;
    this._uiContext = uiContext;
    
    this._expressions = [];
    this._text = null;
    
    this._settings = {};
    this._dom = null;
    this._timerID = null;
    
    var self = this;
    this._listener = { 
        onRootItemsChanged: function() {
            if ("_itemToValue" in self) {
                delete self._itemToValue;
            }
        }
    };
    uiContext.getCollection().addListener(this._listener);
};

Exhibit.TextSearchFacet._settingSpecs = {
    "facetLabel":       { type: "text" },
    "queryParamName":   { type: "text" },
    "requiresEnter":    {type: "boolean", defaultValue: false}
    };

Exhibit.TextSearchFacet.create = function(configuration, containerElmt, uiContext) {
    var uiContext = Exhibit.UIContext.create(configuration, uiContext);
    var facet = new Exhibit.TextSearchFacet(containerElmt, uiContext);
    
    Exhibit.TextSearchFacet._configure(facet, configuration);
    
    facet._initializeUI();
    uiContext.getCollection().addFacet(facet);
    
    return facet;
};

Exhibit.TextSearchFacet.createFromDOM = function(configElmt, containerElmt, uiContext) {
    var configuration = Exhibit.getConfigurationFromDOM(configElmt);
    var uiContext = Exhibit.UIContext.createFromDOM(configElmt, uiContext);
    var facet = new Exhibit.TextSearchFacet(
        containerElmt != null ? containerElmt : configElmt, 
        uiContext
    );
    
    Exhibit.SettingsUtilities.collectSettingsFromDOM(configElmt, Exhibit.TextSearchFacet._settingSpecs, facet._settings);
    
    try {
        var s = Exhibit.getAttribute(configElmt, "expressions");
        if (s != null && s.length > 0) {
            facet._expressions = Exhibit.ExpressionParser.parseSeveral(s);
        }
        
        var query = Exhibit.getAttribute(configElmt, "query");
        
        if (query != null && query.length > 0) {
            facet._text = query;
        }
    } catch (e) {
        SimileAjax.Debug.exception(e, "TextSearchFacet: Error processing configuration of list facet");
    }
    Exhibit.TextSearchFacet._configure(facet, configuration);
    
    facet._initializeUI();
    uiContext.getCollection().addFacet(facet);
    
    return facet;
};

Exhibit.TextSearchFacet._configure = function(facet, configuration) {
    Exhibit.SettingsUtilities.collectSettings(configuration, Exhibit.TextSearchFacet._settingSpecs, facet._settings);
    
    if ("expressions" in configuration) {
        for (var i = 0; i < configuration.expressions.length; i++) {
            facet._expressions.push(Exhibit.ExpressionParser.parse(configuration.expressions[i]));
        }
    }
    if ("selection" in configuration) {
        var selection = configuration.selection;
        for (var i = 0; i < selection.length; i++) {
            facet._valueSet.add(selection[i]);
        }
    }
    if ("query" in configuration) {
        facet._text = configuration.query;
    }
    if ("queryParamName" in facet._settings) {
        var params = SimileAjax.parseURLParameters();
        if (facet._settings["queryParamName"] in params) {
            facet._text = params[facet._settings["queryParamName"]];
        }
    }
    
    if (!("facetLabel" in facet._settings)) {
        facet._settings.facetLabel = "";
    }
}

Exhibit.TextSearchFacet.prototype.dispose = function() {
    this._uiContext.getCollection().removeFacet(this);
    
    this._uiContext.getCollection().removeListener(this._listener);
    this._uiContext = null;
    
    this._div.innerHTML = "";
    this._div = null;
    this._dom = null;
    
    this._expressions = null;
    this._itemToValue = null;
    this._settings = null;
};

Exhibit.TextSearchFacet.prototype.hasRestrictions = function() {
    return this._text != null;
};

Exhibit.TextSearchFacet.prototype.clearAllRestrictions = function() {
    var restrictions = this._text;
    if (this._text != null) {
        this._text = null;

        var preUpdateSize = SimileAjax.RemoteLog.logActive ? this._uiContext.getCollection().countRestrictedItems() : 0;
        this._notifyCollection();
        var postUpdateSize = SimileAjax.RemoteLog.logActive ? this._uiContext.getCollection().countRestrictedItems() : 0;
        var totalSize = SimileAjax.RemoteLog.logActive ? this._uiContext.getCollection().countAllItems() : 0;

        SimileAjax.RemoteLog.possiblyLog({
            facetType:"TextSearch", 
            facetLabel:this._settings.facetLabel, 
            operation:"clearAllRestrictions",
            exhibitSize:totalSize,
            preUpdateSize:preUpdateSize,
            postUpdateSize:postUpdateSize
        });
    }
    this._dom.input.value = "";
    
    return restrictions;
};

Exhibit.TextSearchFacet.prototype.applyRestrictions = function(restrictions) {
    this.setText(restrictions);
};

Exhibit.TextSearchFacet.prototype.setText = function(text) {
    if (text != null) {
        text = text.trim();
        this._dom.input.value = text;
        
        text = text.length > 0 ? text : null;
    } else {
        this._dom.input.value = "";
    }
    //text = escapeHtmlEntities(text); // This code ignores accents in location names
        
    if (text != this._text) {
        this._text = text;
        var preUpdateSize = SimileAjax.RemoteLog.logActive ? this._uiContext.getCollection().countRestrictedItems() : 0;
        this._notifyCollection();
        var postUpdateSize = SimileAjax.RemoteLog.logActive ? this._uiContext.getCollection().countRestrictedItems() : 0;
        var totalSize = SimileAjax.RemoteLog.logActive ? this._uiContext.getCollection().countAllItems() : 0;
        SimileAjax.RemoteLog.possiblyLog({
            facetType:"TextSearch", 
            facetLabel:this._settings.facetLabel, 
            operation:"setText", 
            text:text,
            exhibitSize:totalSize,
            preUpdateSize:preUpdateSize,
            postUpdateSize:postUpdateSize            
        });
    }
}

Exhibit.TextSearchFacet.prototype.restrict = function(items) {
    if (this._text == null) {
        return items;
    } else {
        this._buildMaps();
        
        var set = new Exhibit.Set();
        var itemToValue = this._itemToValue;
        var text = this._text.toLowerCase();
        
        items.visit(function(item) {
            if (item in itemToValue) {
                var values = itemToValue[item];
                for (var v = 0; v < values.length; v++) {
                    if (values[v].indexOf(text) >= 0) {
                        set.add(item);
                        break;
                    }
                }
            }
        });
        return set;
    }
};

Exhibit.TextSearchFacet.prototype.update = function(items) {
    // nothing to do
};

Exhibit.TextSearchFacet.prototype._notifyCollection = function() {
    this._uiContext.getCollection().onFacetUpdated(this);
};

Exhibit.TextSearchFacet.prototype._initializeUI = function() {
    var self = this;
    this._dom = Exhibit.TextSearchFacet.constructFacetFrame(this._div, this._settings.facetLabel);
    
    if (this._text != null) {
        this._dom.input.value = this._text;
    }
    
    SimileAjax.WindowManager.registerEvent(this._dom.input, "keyup",
        function(elmt, evt, target) { self._onTextInputKeyUp(evt); });
};

Exhibit.TextSearchFacet.constructFacetFrame = function(div, facetLabel) {
    if (facetLabel !== "" && facetLabel !== null) {
        return SimileAjax.DOM.createDOMFromString(
            div,
            "<div class='exhibit-facet-header'>" +
                "<span class='exhibit-facet-header-title'>" + facetLabel + "</span>" +
            "</div>" +
            "<div class='exhibit-text-facet'><input type='text' id='input'></div>"
        );
    } else {
        return SimileAjax.DOM.createDOMFromString(
            div,
            "<div class='exhibit-text-facet'><input type='text' id='input'></div>"
        );
    }
};

Exhibit.TextSearchFacet.prototype._onTextInputKeyUp = function(evt) {
    if (this._timerID != null) {
        window.clearTimeout(this._timerID);
    }
    var self = this;
    if (this._settings.requiresEnter  == false) {
    	this._timerID = window.setTimeout(function() { self._onTimeout(); }, 500);
    } else {
    	var newText = this._dom.input.value.trim(); 
   		if (newText.length == 0 || evt.keyCode == 13) { // arbitrary
    	this._timerID = window.setTimeout(function() { self._onTimeout(); }, 0);
    } 
  }
};

Exhibit.TextSearchFacet.prototype._onTimeout = function() {
    this._timerID = null;
    
    var newText = this._dom.input.value.trim();
    if (newText.length == 0) {
        newText = null;
    }
    
    if (newText != this._text) {
        var self = this;
        var oldText = this._text;
        
        SimileAjax.History.addLengthyAction(
            function() { self.setText(newText); },
            function() { self.setText(oldText); },
            newText != null ?
                String.substitute(
                    Exhibit.FacetUtilities.l10n["facetTextSearchActionTitle"],
                    [ newText ]) :
                Exhibit.FacetUtilities.l10n["facetClearTextSearchActionTitle"]
        );
    }
}

Exhibit.TextSearchFacet.prototype._buildMaps = function() {
    if (!("_itemToValue" in this)) {
        var itemToValue = {};
        var allItems = this._uiContext.getCollection().getAllItems();
        var database = this._uiContext.getDatabase();
        
        if (this._expressions.length > 0) {
            var expressions = this._expressions;
            allItems.visit(function(item) {
                var values = [];
                for (var x = 0; x < expressions.length; x++) {
                    var expression = expressions[x];
                    expression.evaluateOnItem(item, database).values.visit(function(v) { values.push(v.toLowerCase()); });
                }
                itemToValue[item] = values;
            });
        } else {
            var propertyIDs = database.getAllProperties();
            allItems.visit(function(item) {
                var values = [];
                for (var p = 0; p < propertyIDs.length; p++) {
                    database.getObjects(item, propertyIDs[p]).visit(function(v) { values.push(v.toLowerCase()); });
                }
                itemToValue[item] = values;
            });
        }
        
        this._itemToValue = itemToValue;
    }
};

Exhibit.TextSearchFacet.prototype.exportFacetSelection = function() { 
  return this._text;
}; 
 
Exhibit.TextSearchFacet.prototype.importFacetSelection = function(settings) { 
  this.setText(settings);
}

escapeHtmlEntities = function (text) {
    return text.replace(/[\u00A0-\u2666<>\&]/g, function(c) {
        return '&' + 
        (escapeHtmlEntities.entityTable[c.charCodeAt(0)] || '#'+c.charCodeAt(0)) + ';';
    });
};

// all HTML4 entities as defined here: http://www.w3.org/TR/html4/sgml/entities.html
// added: amp, lt, gt, quot and apos
escapeHtmlEntities.entityTable = {
    34 : 'quot', 
    38 : 'amp', 
    39 : 'apos', 
    60 : 'lt', 
    62 : 'gt', 
    160 : 'nbsp', 
    161 : 'iexcl', 
    162 : 'cent', 
    163 : 'pound', 
    164 : 'curren', 
    165 : 'yen', 
    166 : 'brvbar', 
    167 : 'sect', 
    168 : 'uml', 
    169 : 'copy', 
    170 : 'ordf', 
    171 : 'laquo', 
    172 : 'not', 
    173 : 'shy', 
    174 : 'reg', 
    175 : 'macr', 
    176 : 'deg', 
    177 : 'plusmn', 
    178 : 'sup2', 
    179 : 'sup3', 
    180 : 'acute', 
    181 : 'micro', 
    182 : 'para', 
    183 : 'middot', 
    184 : 'cedil', 
    185 : 'sup1', 
    186 : 'ordm', 
    187 : 'raquo', 
    188 : 'frac14', 
    189 : 'frac12', 
    190 : 'frac34', 
    191 : 'iquest', 
    192 : 'Agrave', 
    193 : 'Aacute', 
    194 : 'Acirc', 
    195 : 'Atilde', 
    196 : 'Auml', 
    197 : 'Aring', 
    198 : 'AElig', 
    199 : 'Ccedil', 
    200 : 'Egrave', 
    201 : 'Eacute', 
    202 : 'Ecirc', 
    203 : 'Euml', 
    204 : 'Igrave', 
    205 : 'Iacute', 
    206 : 'Icirc', 
    207 : 'Iuml', 
    208 : 'ETH', 
    209 : 'Ntilde', 
    210 : 'Ograve', 
    211 : 'Oacute', 
    212 : 'Ocirc', 
    213 : 'Otilde', 
    214 : 'Ouml', 
    215 : 'times', 
    216 : 'Oslash', 
    217 : 'Ugrave', 
    218 : 'Uacute', 
    219 : 'Ucirc', 
    220 : 'Uuml', 
    221 : 'Yacute', 
    222 : 'THORN', 
    223 : 'szlig', 
    224 : 'agrave', 
    225 : 'aacute', 
    226 : 'acirc', 
    227 : 'atilde', 
    228 : 'auml', 
    229 : 'aring', 
    230 : 'aelig', 
    231 : 'ccedil', 
    232 : 'egrave', 
    233 : 'eacute', 
    234 : 'ecirc', 
    235 : 'euml', 
    236 : 'igrave', 
    237 : 'iacute', 
    238 : 'icirc', 
    239 : 'iuml', 
    240 : 'eth', 
    241 : 'ntilde', 
    242 : 'ograve', 
    243 : 'oacute', 
    244 : 'ocirc', 
    245 : 'otilde', 
    246 : 'ouml', 
    247 : 'divide', 
    248 : 'oslash', 
    249 : 'ugrave', 
    250 : 'uacute', 
    251 : 'ucirc', 
    252 : 'uuml', 
    253 : 'yacute', 
    254 : 'thorn', 
    255 : 'yuml', 
    402 : 'fnof', 
    913 : 'Alpha', 
    914 : 'Beta', 
    915 : 'Gamma', 
    916 : 'Delta', 
    917 : 'Epsilon', 
    918 : 'Zeta', 
    919 : 'Eta', 
    920 : 'Theta', 
    921 : 'Iota', 
    922 : 'Kappa', 
    923 : 'Lambda', 
    924 : 'Mu', 
    925 : 'Nu', 
    926 : 'Xi', 
    927 : 'Omicron', 
    928 : 'Pi', 
    929 : 'Rho', 
    931 : 'Sigma', 
    932 : 'Tau', 
    933 : 'Upsilon', 
    934 : 'Phi', 
    935 : 'Chi', 
    936 : 'Psi', 
    937 : 'Omega', 
    945 : 'alpha', 
    946 : 'beta', 
    947 : 'gamma', 
    948 : 'delta', 
    949 : 'epsilon', 
    950 : 'zeta', 
    951 : 'eta', 
    952 : 'theta', 
    953 : 'iota', 
    954 : 'kappa', 
    955 : 'lambda', 
    956 : 'mu', 
    957 : 'nu', 
    958 : 'xi', 
    959 : 'omicron', 
    960 : 'pi', 
    961 : 'rho', 
    962 : 'sigmaf', 
    963 : 'sigma', 
    964 : 'tau', 
    965 : 'upsilon', 
    966 : 'phi', 
    967 : 'chi', 
    968 : 'psi', 
    969 : 'omega', 
    977 : 'thetasym', 
    978 : 'upsih', 
    982 : 'piv', 
    8226 : 'bull', 
    8230 : 'hellip', 
    8242 : 'prime', 
    8243 : 'Prime', 
    8254 : 'oline', 
    8260 : 'frasl', 
    8472 : 'weierp', 
    8465 : 'image', 
    8476 : 'real', 
    8482 : 'trade', 
    8501 : 'alefsym', 
    8592 : 'larr', 
    8593 : 'uarr', 
    8594 : 'rarr', 
    8595 : 'darr', 
    8596 : 'harr', 
    8629 : 'crarr', 
    8656 : 'lArr', 
    8657 : 'uArr', 
    8658 : 'rArr', 
    8659 : 'dArr', 
    8660 : 'hArr', 
    8704 : 'forall', 
    8706 : 'part', 
    8707 : 'exist', 
    8709 : 'empty', 
    8711 : 'nabla', 
    8712 : 'isin', 
    8713 : 'notin', 
    8715 : 'ni', 
    8719 : 'prod', 
    8721 : 'sum', 
    8722 : 'minus', 
    8727 : 'lowast', 
    8730 : 'radic', 
    8733 : 'prop', 
    8734 : 'infin', 
    8736 : 'ang', 
    8743 : 'and', 
    8744 : 'or', 
    8745 : 'cap', 
    8746 : 'cup', 
    8747 : 'int', 
    8756 : 'there4', 
    8764 : 'sim', 
    8773 : 'cong', 
    8776 : 'asymp', 
    8800 : 'ne', 
    8801 : 'equiv', 
    8804 : 'le', 
    8805 : 'ge', 
    8834 : 'sub', 
    8835 : 'sup', 
    8836 : 'nsub', 
    8838 : 'sube', 
    8839 : 'supe', 
    8853 : 'oplus', 
    8855 : 'otimes', 
    8869 : 'perp', 
    8901 : 'sdot', 
    8968 : 'lceil', 
    8969 : 'rceil', 
    8970 : 'lfloor', 
    8971 : 'rfloor', 
    9001 : 'lang', 
    9002 : 'rang', 
    9674 : 'loz', 
    9824 : 'spades', 
    9827 : 'clubs', 
    9829 : 'hearts', 
    9830 : 'diams', 
    338 : 'OElig', 
    339 : 'oelig', 
    352 : 'Scaron', 
    353 : 'scaron', 
    376 : 'Yuml', 
    710 : 'circ', 
    732 : 'tilde', 
    8194 : 'ensp', 
    8195 : 'emsp', 
    8201 : 'thinsp', 
    8204 : 'zwnj', 
    8205 : 'zwj', 
    8206 : 'lrm', 
    8207 : 'rlm', 
    8211 : 'ndash', 
    8212 : 'mdash', 
    8216 : 'lsquo', 
    8217 : 'rsquo', 
    8218 : 'sbquo', 
    8220 : 'ldquo', 
    8221 : 'rdquo', 
    8222 : 'bdquo', 
    8224 : 'dagger', 
    8225 : 'Dagger', 
    8240 : 'permil', 
    8249 : 'lsaquo', 
    8250 : 'rsaquo', 
    8364 : 'euro'
};
/*
KiBlue Limited

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Build according to the Revealing Prototype Pattern and .call instead of passing thisObject
*/
// API Call Sample, in order to use it you will have to Install & Configure M-Files WebAccess
// The Version of the M-Files PAI used and tested against is 10.1 (10.1.3915.45)
// http://192.168.10.10:80/REST/server/authenticationtokens.aspx?Username=myusername&Password=mypassword&VaultGuid={1FC7D3HH-3EB6-4D29-AF12-732B816B2C46}

var KiBlue = KiBlue || {};

//Constructor defines properties and inits object
KiBlue.DMSHelper = function (_url, _port, _username, _password, _vaultid) {
    // Private Members
    this.url = 'http://' + _url + ':' + _port + '/REST/';
    this.port = _port;
    this.username = _username;
    this.password = _password;
    this.vaultid = _vaultid;
    this.token = null;
    this.propertydefs = [];
    this.classdefs = [];
};

// Prototype pattern will give the option to override any method exposed as public
// without changing the original source file
KiBlue.DMSHelper.prototype = function () {
    // Private functions
    // Connect to M-Files and receive an authentication token
    var login = function() {
            $.ajax({
                // for HOST and PORT use your variables e.g. 192.168.1.1:80
                url: this.url + 'server/authenticationtokens.aspx',
                type: 'POST',
                dataType: 'json',
                async: false,
                // Very important set the correct context for the processToken Function. 
                // Without this this.token would have the context of the processToken function instead of the DMSHelper class
                context: this,
                contentType: 'application/json',
                data: JSON.stringify({
                    Username: this.username,
                    Password: this.password,
                    VaultGuid: this.vaultid
                }),
                success: function(token) {
                    // Store the token in our DMSHelper
                    this.token = token.Value;
                    // Set the default header and other options in the ajaxSetup for all subsequent calls
                    $.ajaxSetup({
                        headers: { 'X-Authentication': this.token },
                        async: false,
                        context: this,
                        contentType: 'application/json'
                    });

                },
                error: function(err) {
                    console.log(err.responseText);
                }
            });
        },
        getclassdefinitions = function () {

            $.ajax({
                type: "GET",
                url: this.url + 'structure/classes?0',
                dataType: "json",
                success: function(classes) {
                    this.classdefs = classes;
                },
                error: function(error) {
                    console.log(error.responseText);
                }

            });
        },
        getpropertiedefs = function() {
            $.ajax({
                type: "GET",

                url: this.url + 'structure/properties',
                dataType: "json",
                success: function(properties) {
                    this.propertydefs = properties;
                },
                error: function(error) {
                    console.log(error.responseText);
                }
            });
        },
        getrecentlyaccessedbyme = function() {
            var returnResults;

            $.ajax({
                url: this.url + 'recentlyaccessedbyme',
                success: function(res) {
                    returnResults = res;
                }
            });

            return returnResults;
        },
        addrecentlyaccessedbyme = function(objecttypeid, objectid) {
            var returnResults;

            $.ajax({
                type: 'POST',
                url: this.url + 'recentlyaccessedbyme',
                headers: { 'X-Authentication': this.token },
                data: JSON.stringify({ ID: objectid, Type: objecttypeid }),
                success: function(res) {
                    returnResults = res;
                },
                error: function(error) {
                    console.log(error.responseText);
                }
            });

            return returnResults;
        },
        getfavorites = function() {
            var returnResults;

            $.ajax({
                type: 'GET',
                url: this.url + 'favorites',
                headers: { 'X-Authentication': this.token },
                success: function(res) {
                    returnResults = res;
                },
                error: function(error) {
                    console.log(error.responseText);
                }
            });

            return returnResults;
        },
        addtofavorites = function(objecttypeid, objectid) {
            var returnResults;

            $.ajax({
                type: 'POST',
                url: this.url + 'favorites',
                headers: { 'X-Authentication': this.token },
                data: JSON.stringify({ ID: objectid, Type: objecttypeid }),
                success: function(res) {
                    returnResults = res;
                },
                error: function(error) {
                    console.log(error.responseText);
                }
            });

            return returnResults;
        },
        search = function(_searchText) {
            var returnResults;

            $.ajax({
                    // expression   = 'q=searchtext' for Quicksearch
                    async: true,
                    url: this.url + 'objects.aspx?q=' + _searchText
                })
                .done(function(data) {
                    returnResults = data.Items;
                });
            return returnResults;
        },
        openfile = function(href /* use either href or leave it as "" and dpsecify all the other params*/,
            objecttypeid,
            objectid,
            fileid,
            docversion /*optional*/) {

            var version = 'latest',
                downloadLinkUrl = "",
                returnVal = "";

            if (arguments.length == 4)
                version = docversion;

            if (arguments.length == 1)
                downloadLinkUrl = href;
            else
                downloadLinkUrl = this.url + 'objects/' + objecttypeid + '/' + objectid + '/' + version + '/files/' + fileid + '/content';

            $.ajax({
                type: "GET",
                url: downloadLinkUrl,
                dataType: "json",
                headers: { 'X-Authentication': this.token },
                success: function(data) {
                },
                // this error is intended since the Result returns binary data but the ajax call expects json
                // you will see the Status is 200 which means the call was successfully authenticated and executed
                // since API file download requires an authenticated call we have to use this workaround here to download the file
                error: function(intended_error) {
                    if (intended_error.status === 200)
                        returnVal = downloadLinkUrl;
                    else {
                        console.log(intended_error.statusText);
                    }
                }
            });

            return returnVal;
        },
        getmetadata = function(objecttypeid, objectid, docversion) {
            var results;

            $.ajax({
                type: "GET",
                url: this.url + 'objects/' + objecttypeid + '/' + objectid + '/' + docversion + '/properties?forDisplay',
                dataType: "json",
                success: function(data) {
                    results = data;
                    console.dir(data);
                    var props = this.propertydefs;
                    _.each(data, function(item) {
                        var prop = _.find(props, function(row) {
                            return row.ID == item.PropertyDef;
                        });
                        item.Property = prop.Name;
                        item.Value = item.TypedValue.DisplayValue;
                    });
                },
                error: function(error) {
                    console.log(error.responseText);
                }
            });

            // Underscore.js Alphanumeric sorting by M-Files Property Name
            return _.sortBy(results, "Property");

        },
        getdynamicmetadataviewmodel = function (objecttypeid, objectid, docversion) {
            var dynamicJson,
                fields = [];
            // Sample layout
            // {"fields": [ 
            //              { "name": "Field1", "label": "Field 1", "type": "text", "required": false, "css": "cssClass1" },
            //              { "name": "Field2", "label": "Field 2", "type": "text", "required": true, "css": "cssClass2" },
            //              { "name": "CheckField", "label": "Checkbox Field", "type": "checkbox", "required": false, "css": "cssClass2" },
            //              { "name": "Email", "label": "Email Address", "type": "email", "required": true, "css": "cssClass2" },
            //              { "name": "Password", "label": "Password", "type": "password", "required": true, "css": "cssClass2" }
            // ]}

            $.ajax({
                type: "GET",
                url: this.url + 'objects/' + objecttypeid + '/' + objectid + '/' + docversion + '/properties?forDisplay',
                dataType: "json",
                success: function (data) {
                    var counter = 1;
                    var props = this.propertydefs;
                    
                    _.each(data, function (item) {
                        var prop = _.find(props, function (row) {
                            return row.ID == item.PropertyDef;
                        });
                        item.Property = prop.Name;
                        item.Value = item.TypedValue.DisplayValue;

                        fields.push({
                            name: "field"+(counter++),
                            label: item.Property,
                            type: dataTypeHandler(item.TypedValue.DataType),
                            required: true,
                            css: ""
                        });
                    });
                },
                error: function (error) {
                    console.log(error.responseText);
                }
            });
            dynamicJson = {
                fields: fields
            };
            return dynamicJson;

        },
        getcheckedouttome = function () {
            var results;

            $.ajax({
                type: "GET",
                url: this.url + 'views/V5/items.aspx',
                headers: { 'X-Authentication': this.token },
                dataType: "json",
                success: function (checkedouttome) {
                    results = checkedouttome.Items;
                },
                error: function (error) {
                    console.log(error.responseText);
                }
            });

            // Underscore.js Alphanumeric sorting by M-Files Property Name
            return _.sortBy(results, "Property");
        },
        getcheckoutstatus = function(objecttypeid, objectid, docversion) {
            var results;

            $.ajax({
                type: "GET",
                url: this.url + 'objects/' + objecttypeid + '/' + objectid + '/' + docversion + '/checkedout',
                headers: { 'X-Authentication': this.token },
                dataType: "json",
                success: function(checkedoutstatus) {
                    results = checkedoutstatus;
                },
                error: function(error) {
                    console.log(error.responseText);
                }
            });

            // Underscore.js Alphanumeric sorting by M-Files Property Name
            return _.sortBy(results, "Property");
        },
        checkinorout = function(MFCheckOutStatus, objecttypeid, objectid, docversion) {
            var results;

            $.ajax({
                type: "POST",
                url: this.url + 'objects/' + [objecttypeid, objectid, docversion].join("/") + '/checkedout.aspx?_method=PUT',
                headers: { 'X-Authentication': this.token },
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify({ Value: MFCheckOutStatus }),
                success: function(objectVersion) {
                    results = objectVersion;
                },
                error: function(error) {
                    console.log(error.responseText);
                }
            });

            return results;
        },
        getversionhistory = function(objecttypeid, objectid) {
            var results;
            ///objects/(type)/(objectid)/history
            $.ajax({
                type: "GET",
                url: this.url + 'objects/' + [objecttypeid, objectid].join("/")  + '/history',
                headers: { 'X-Authentication': this.token },
                dataType: "json",
                success: function (historydocs) {
                    results = historydocs;
                },
                error: function (error) {
                    console.log(error.responseText);
                }
            });

            // Underscore.js Alphanumeric sorting by M-Files Property Name
            return results;
        },
        attachdocument = function(name) {
            // Post the object data.
            $.ajax({
                url: this.url + "objects/0.aspx",
                type: "POST",
                dataType: "json",
                contentType: "application/json",
                headers: { 'X-Authentication': this.token },
                data: JSON.stringify({
                    PropertyValues: [{
                        // Document name
                        PropertyDef: 0,
                        TypedValue: { DataType: 1, Value: name }
                    }, {
                        // "Single File" property
                        PropertyDef: 22,
                        TypedValue: { DataType: 8, Value: false }
                    }, {
                        // Class.
                        PropertyDef: 100,
                        TypedValue: { DataType: 9, Lookup: { Item: 0 } }
                    }],
                    Files: []
                }),
                success: function (objvers) {
                    toastr.success(objvers.Title + " created successfully but no files attached since this feature is still missing.");
                },
                error: function (error) {
                    console.log(error.responseText);
                }
            });
        };

    function dataTypeHandler(MFDataType) {
        switch (MFDataType) {
            case MFWS.Enumerations.MFDataType.Uninitialized:
                return 'unknown';
            case MFWS.Enumerations.MFDataType.Text: return 'text';
            case MFWS.Enumerations.MFDataType.Integer: return 'text';
            case MFWS.Enumerations.MFDataType.Floating: return 'text';
            case MFWS.Enumerations.MFDataType.Date: return 'text';
            case MFWS.Enumerations.MFDataType.Time: return 'text';
            case MFWS.Enumerations.MFDataType.Timestamp: return 'text';
            case MFWS.Enumerations.MFDataType.Boolean: return 'checkbox';
                //                            case MFWS.MFDataType.Lookup: return 'unknown';
                //                            case MFWS.MFDataType.MultiSelectLookup: return 'unknown';
            case MFWS.Enumerations.MFDataType.Integer64: return 'text';
            case MFWS.Enumerations.MFDataType.FILETIME: return 'text';
            case MFWS.Enumerations.MFDataType.MultiLineText: return 'text';
                //                            case MFWS.MFDataType.ACL: return 'unknown';
            default:
                return 'unknown';
        }
    }

    return {
        // Public members and functions
        addrecentlyaccessedbyme: addrecentlyaccessedbyme,
        attachdocument: attachdocument,
        addtofavorites: addtofavorites,
        getcheckedouttome : getcheckedouttome,
        getcheckoutstatus: getcheckoutstatus,
        getclassdefinitions: getclassdefinitions,
        getdynamicmetadataviewmodel: getdynamicmetadataviewmodel,
        getfavorites: getfavorites,
        getmetadata: getmetadata,
        getpropertiedefs: getpropertiedefs,
        getrecentlyaccessedbyme: getrecentlyaccessedbyme,
        getversionhistory:getversionhistory,
        checkinorout: checkinorout,
        login: login,
        openfile: openfile,
        search: search
    };
}();


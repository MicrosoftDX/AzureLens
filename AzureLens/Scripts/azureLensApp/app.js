// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.
///<reference path="typings/velocity-animate/velocity-animate.d.ts" />
///<reference path="IAppView.ts" />
///<reference path="app3DView.ts" />
var BoxData = (function () {
    function BoxData() {
    }
    return BoxData;
})();
var CylinderData = (function () {
    function CylinderData() {
    }
    return CylinderData;
})();
var ObjectData = (function () {
    function ObjectData() {
    }
    return ObjectData;
})();
var ARROW_TYPE;
(function (ARROW_TYPE) {
    ARROW_TYPE[ARROW_TYPE["Simple"] = 0] = "Simple";
    ARROW_TYPE[ARROW_TYPE["ArrowTip"] = 1] = "ArrowTip";
    ARROW_TYPE[ARROW_TYPE["ArrowTipBothEnds"] = 2] = "ArrowTipBothEnds";
})(ARROW_TYPE || (ARROW_TYPE = {}));
var BOX2D_TYPE;
(function (BOX2D_TYPE) {
    BOX2D_TYPE[BOX2D_TYPE["BorderOnly"] = 0] = "BorderOnly";
    BOX2D_TYPE[BOX2D_TYPE["Filled"] = 1] = "Filled";
})(BOX2D_TYPE || (BOX2D_TYPE = {}));
var BOX_TYPE;
(function (BOX_TYPE) {
    BOX_TYPE[BOX_TYPE["VM"] = 0] = "VM";
    BOX_TYPE[BOX_TYPE["WebSite"] = 1] = "WebSite";
    BOX_TYPE[BOX_TYPE["O365"] = 2] = "O365";
    BOX_TYPE[BOX_TYPE["GitRepo"] = 3] = "GitRepo";
    BOX_TYPE[BOX_TYPE["GitHub"] = 4] = "GitHub";
    BOX_TYPE[BOX_TYPE["VSO"] = 5] = "VSO";
    BOX_TYPE[BOX_TYPE["MachineLearning"] = 6] = "MachineLearning";
    BOX_TYPE[BOX_TYPE["HDInsight"] = 7] = "HDInsight";
    BOX_TYPE[BOX_TYPE["StreamAnalytics"] = 8] = "StreamAnalytics";
    BOX_TYPE[BOX_TYPE["EventHubs"] = 9] = "EventHubs";
})(BOX_TYPE || (BOX_TYPE = {}));
var LOWBOX_TYPE;
(function (LOWBOX_TYPE) {
    LOWBOX_TYPE[LOWBOX_TYPE["Server"] = 0] = "Server";
})(LOWBOX_TYPE || (LOWBOX_TYPE = {}));
var TEXT_TYPE;
(function (TEXT_TYPE) {
    TEXT_TYPE[TEXT_TYPE["Flat"] = 0] = "Flat";
    TEXT_TYPE[TEXT_TYPE["Floating"] = 1] = "Floating";
})(TEXT_TYPE || (TEXT_TYPE = {}));
var IMAGE_TYPE;
(function (IMAGE_TYPE) {
    IMAGE_TYPE[IMAGE_TYPE["Flat"] = 0] = "Flat";
    IMAGE_TYPE[IMAGE_TYPE["Floating"] = 1] = "Floating";
})(IMAGE_TYPE || (IMAGE_TYPE = {}));
var CYLINDER_TYPE;
(function (CYLINDER_TYPE) {
    CYLINDER_TYPE[CYLINDER_TYPE["AzureCache"] = 0] = "AzureCache";
    CYLINDER_TYPE[CYLINDER_TYPE["AzureSQL"] = 1] = "AzureSQL";
    CYLINDER_TYPE[CYLINDER_TYPE["DocumentDB"] = 2] = "DocumentDB";
    CYLINDER_TYPE[CYLINDER_TYPE["MySQL"] = 3] = "MySQL";
    CYLINDER_TYPE[CYLINDER_TYPE["SQLDataSync"] = 4] = "SQLDataSync";
    CYLINDER_TYPE[CYLINDER_TYPE["SQLDatabase"] = 5] = "SQLDatabase";
    CYLINDER_TYPE[CYLINDER_TYPE["BlobStorage"] = 6] = "BlobStorage";
})(CYLINDER_TYPE || (CYLINDER_TYPE = {}));
var AzureLens = (function () {
    function AzureLens() {
        var _this = this;
        this._objects = {};
        this.selectedItem = null;
        this.menu = null;
        this.authContext = createADALInstance();
        this.isUserLoggedIn(function (result) {
            if (result) {
                $('#userSignOut').show();
                $('#userSignIn').hide();
                var userInfo = _this.authContext.getCachedUser();
                $('#userEmailAddress').text(userInfo.profile.unique_name);
                $("#userWelcome").show();
            }
            else {
                $('#userSignOut').hide();
                $('#userSignIn').show();
                $("#userWelcome").hide();
            }
        });
        $('#userSignIn').click(function () {
            $('#userSignOut').show();
            $('#userSignIn').hide();
            _this.login();
        });
        $('#userSignOut').click(function () {
            _this.logOut();
        });
        this._objects = {};
        this.visualizer = new app3DView();
        this.visualizer.displayPopup = this.displayPopup.bind(this);
        document.getElementById("popupExpand").addEventListener("click", function (evt) { _this.popupExpand(); });
        document.getElementById("expandedClose").addEventListener("click", function (evt) { _this.expandedClose(); });
        var colorEditor = $("#arrowColor");
        colorEditor.spectrum({});
        colorEditor = $("#textColor");
        colorEditor.spectrum({});
        colorEditor = $("#boxColor");
        colorEditor.spectrum({});
        window.addEventListener('click', function (evt) {
            _this.visualizer.click(evt);
        });
        window.addEventListener('keyup', function (evt) {
            _this.visualizer.keyUp(evt);
        }, false);
        window.addEventListener('keydown', function (evt) {
            _this.visualizer.keyDown(evt);
        }, false);
        window.addEventListener('mousedown', function (evt) {
            _this.visualizer.mouseDown(evt);
        }, false);
        window.addEventListener('pointerdown', function (evt) {
            _this.visualizer.pointerDown(evt);
        }, false);
        window.addEventListener('pointermove', function (evt) {
            _this.visualizer.pointerMove(evt);
        }, false);
        window.addEventListener('pointerup', function (evt) {
            _this.visualizer.pointerUp(evt);
        }, false);
        window.addEventListener("resize", function () {
            if (_this._canvas != null) {
                _this._canvas.width = window.innerWidth;
                _this._canvas.height = window.innerHeight;
            }
            _this.visualizer.resize(null);
            if (_this.menu != null) {
                _this.menu.multilevelpushmenu('redraw');
            }
        });
        this.menu = $('#menu');
        this.menu.visible = false;
        this.menu.multilevelpushmenu({
            direction: 'ltr',
            backItemIcon: 'fa fa-angle-left',
            groupIcon: 'fa fa-angle-right',
            collapsed: false,
            menuHeight: '100%',
            onExpandMenuStart: function () {
                _this.expandedClose();
            },
            onItemClick: function (a, b, args) {
                _this.expandedClose();
                _this.closePopup();
                var element = args[0];
                var anchor = element.firstElementChild;
                if (anchor.href.indexOf('#nav') > 0) {
                    //Navigation menus
                    var id = anchor.href.substr(anchor.href.indexOf('#nav') + 4, anchor.href.length - anchor.href.indexOf('#nav') - 4);
                    //this.manualMode = false;
                    var value = id;
                    _this._definition.objects.forEach(function (item) {
                        if (value == item.id) {
                            _this.visualizer.navigateToMesh(item);
                        }
                    });
                    window.event.cancelBubble = true;
                }
                else if (anchor.href.indexOf('diag') > 0) {
                    //Diagram menus
                    var id = anchor.href.substr(anchor.href.indexOf('#diag') + 5, anchor.href.length - anchor.href.indexOf('#diag') - 5);
                    _this.loadDiagram(id);
                }
                else if (anchor.href.indexOf('#save') > 0) {
                    _this.saveDiagram();
                }
                else if (anchor.href.indexOf('#edit') > 0) {
                    if (!_this.visualizer.isEditing())
                        _this.enterEditMode();
                    else {
                        _this.leaveEditAndRefresh();
                    }
                }
                else if (anchor.href.indexOf('#goHome') > 0) {
                    _this.goHome();
                }
                else if (anchor.href.indexOf('#download') > 0) {
                    _this.showDownloads();
                }
                else if (anchor.href.indexOf('#openfile') > 0) {
                    a.preventDefault();
                    var input = anchor.nextElementSibling;
                    var fileReader = new FileLoader(input);
                    fileReader.openLocal(function (doc) {
                        _this.createScene(doc.contents);
                    });
                }
                else if (anchor.href.indexOf('#fileNew') > 0) {
                    _this.newDiagram();
                }
                else if (anchor.href.indexOf('#fileshare') > 0) {
                    _this.shareDiagram();
                }
                else if (anchor.href.indexOf('#openserver') > 0) {
                    _this.openFromServer();
                }
                else {
                    _this.notImplemented();
                }
            }
        });
        var btn = null;
        //Delete button
        btn = document.getElementById('btnDelete');
        btn.addEventListener("click", function (evt) {
            if (_this.visualizer.deleteObject()) {
                _this.closePopup();
            }
        });
        //Add button
        btn = document.getElementById('btnAdd');
        btn.addEventListener("click", function (evt) {
            $("#popupEditButtons").hide();
            $('#popupDescription').hide();
            $('#incompleteMessage').hide();
            _this.popupExpand();
            $('#popupAddingObject').velocity('transition.slideRightIn', { duration: 350, delay: 100 });
            //$("popupAddingObject").velocity("transition.bounceRightIn", 1250); // need TS definition, pull from MEEportal
            //Also disable/remove/overlay other buttons while in Add etc
        });
        var ul = document.getElementById('listViewResources');
        ul.onclick = function (event) {
            var t = event.srcElement;
            var objType = "";
            if (t.attributes["id"] == null)
                objType = t.parentElement.attributes["id"].value.replace('listViewResources', '');
            else
                objType = t.attributes["id"].value.replace('listViewResources', '');
            _this.visualizer.addObject(objType);
            _this.expandedClose();
            $('#popupEditButtons').show();
            $('#popupDescription').show();
        };
        //Edit properties button
        btn = document.getElementById('btnProperties');
        btn.addEventListener("click", function (evt) {
            $('#incompleteMessage').hide();
            $('#editPropertiesPanel').velocity('transition.slideRightIn', 350);
            _this.visualizer.showPropertyEditor();
            _this.popupExpand();
        });
        //Save properties button
        btn = document.getElementById('propertiesSave');
        btn.addEventListener("click", function (evt) {
            if (_this.visualizer.saveProperties()) {
                $('#incompleteMessage').show();
                $('#editPropertiesPanel').hide();
                _this.expandedClose();
            }
        });
        //Cancel properties edit button
        btn = document.getElementById('propertiesCancel');
        btn.addEventListener("click", function (evt) {
            _this.expandedClose();
        });
    }
    AzureLens.prototype.login = function () {
        if (!this.authContext.getCachedUser()) {
            this.authContext.config.redirectUri = window.location.href;
            this.authContext.login();
            return;
        }
        ;
    };
    AzureLens.prototype.logOut = function () {
        this.authContext.logOut();
    };
    AzureLens.prototype.isUserLoggedIn = function (callback) {
        this.authContext.acquireToken(this.authContext.config.clientId, function (error, token) {
            if (token != null)
                callback(true);
            else
                callback(false);
        });
    };
    AzureLens.prototype.goHome = function () {
        if (this._definition != null) {
            if (this._definition.objects.length > 0) {
                this.visualizer.navigateToMesh(this._definition.objects[0]);
            }
        }
    };
    AzureLens.prototype.enterEditMode = function () {
        var _this = this;
        this.isUserLoggedIn(function (result) {
            if (result) {
                _this.visualizer.enterEditMode();
            }
            else {
                window.alert("Please login first");
            }
        });
    };
    AzureLens.prototype.newDiagram = function () {
        this.loadDiagram("New.json");
    };
    AzureLens.prototype.loadDiagram = function (id) {
        var _this = this;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", "SampleModels/" + id, true);
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                _this.destroyScene();
                _this.createScene(xmlhttp.responseText);
            }
        };
        xmlhttp.send();
    };
    AzureLens.prototype.loadUserDiagram = function (id) {
        var _this = this;
        this.authContext.acquireToken(this.authContext.config.clientId, function (error, token) {
            $.ajax({
                type: "GET",
                url: "services/v1/diagrams/" + id,
                dataType: 'json',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            }).done(function (result) {
                _this.destroyScene();
                _this.createScene(JSON.stringify(result));
            });
        });
    };
    AzureLens.prototype.shareDiagram = function () {
        var _this = this;
        if (this._definition.id == null) {
            window.alert("You can only share a diagram you have saved");
            return;
        }
        this.isUserLoggedIn(function (result) {
            if (result) {
                var authContext = createADALInstance();
                authContext.acquireToken(authContext.config.clientId, function (error, token) {
                    var token = token;
                    $.ajax({
                        type: "POST",
                        url: "services/v1/diagrams/" + _this._definition.id + "/share",
                        dataType: 'json',
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    }).done(function (result) {
                        prompt("Here's the URL for your shared diagram", "http://www.azurelens.net/?share=" + result, function (nothing) {
                        });
                    });
                });
            }
            else {
                window.alert("Please login first");
            }
        });
    };
    AzureLens.prototype.performOperationOnUserDiagrams = function (callback) {
        var _this = this;
        this.isUserLoggedIn(function (result) {
            if (result) {
                _this.authContext.acquireToken(_this.authContext.config.clientId, function (error, token) {
                    var token = token;
                    $.ajax({
                        type: "GET",
                        url: "services/v1/diagrams/",
                        dataType: 'json',
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    }).done(callback);
                });
            }
            else {
                window.alert("Please login first");
            }
        });
    };
    AzureLens.prototype.openFromServer = function () {
        var self = this;
        this.performOperationOnUserDiagrams(function (result) {
            self.popupExpand();
            $("#fileOpenPanel").show();
            $("#incompleteMessage").hide();
            var list = document.getElementById("listViewFiles");
            list.innerHTML = "";
            result.forEach(function (file) {
                var docElement = document.createElement("div");
                docElement.appendChild(document.createTextNode(file.name));
                docElement.addEventListener("click", function (evt) {
                    self.loadUserDiagram(file.id);
                });
                list.appendChild(docElement);
            });
        });
    };
    AzureLens.prototype.showDownloads = function () {
        var self = this;
        this.performOperationOnUserDiagrams(function (result) {
            self.popupExpand();
            $("#fileDownloadPanel").show();
            $("#incompleteMessage").hide();
            var list = document.getElementById("listViewFiles2");
            list.innerHTML = "";
            result.forEach(function (file) {
                var anchor = document.createElement("a");
                anchor.text = file.name;
                self.authContext.acquireToken(self.authContext.config.clientId, function (error, token) {
                    anchor.href = "services/v1/file/" + file.id + "?token=" + token;
                });
                anchor.setAttribute("download", "diagram.json");
                list.appendChild(anchor);
            });
        });
    };
    AzureLens.prototype.saveDiagram = function () {
        var _this = this;
        this.isUserLoggedIn(function (authResult) {
            if (authResult) {
                if (_this._definition.id != null) {
                    var definition = _this._definition;
                    var diagram = JSON.stringify(definition);
                    var resource = _this.authContext.getResourceForEndpoint(window.location.href);
                    var token = _this.authContext.getCachedToken(resource);
                    $.ajax({
                        type: "PUT",
                        url: "services/v1/diagrams/" + _this._definition.id,
                        dataType: 'json',
                        contentType: 'application/json',
                        data: diagram,
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    }).done(function (result) {
                        alert("Diagram saved");
                    }).fail(function () {
                        alert("Unable to save this diagram.");
                    });
                }
                else {
                    prompt("Please enter the name of the diagram", "diagram1", function (result) {
                        if (result === null) {
                            return;
                        }
                        else {
                            var definition = _this._definition;
                            definition.name = result;
                            var diagram = JSON.stringify(definition);
                            var resource = _this.authContext.getResourceForEndpoint(window.location.href);
                            var token = _this.authContext.getCachedToken(resource);
                            $.ajax({
                                type: "POST",
                                url: "services/v1/diagrams/",
                                dataType: 'json',
                                contentType: 'application/json',
                                data: diagram,
                                headers: {
                                    'Authorization': 'Bearer ' + token
                                }
                            }).done(function (result) {
                                _this._definition.id = result;
                                alert("Diagram saved");
                            }).fail(function () {
                                alert("Unable to save this diagram.");
                            });
                        }
                    });
                }
            }
            else {
                window.alert("Please login first");
            }
        });
    };
    AzureLens.prototype.displayPopup = function (item, editing, visualizer) {
        var popupDiv = document.getElementById("popupDiv");
        var popupName = document.getElementById("popupName");
        var popupDescription = document.getElementById("popupDescription");
        var popupButtons = document.getElementById("popupButtons");
        if (item.description != null || editing) {
            $("#popupDiv").velocity("transition.slideRightIn", 250);
            popupName.innerText = "Name: " + item.id;
            popupDescription.innerText = item.description;
            popupDescription.style.display = "";
            popupButtons.innerHTML = "";
            if (editing) {
                $('#popupEditButtons').show();
            }
            else {
                $('#popupEditButtons').hide();
            }
        }
        else
            popupDiv.style.display = "none";
    };
    AzureLens.prototype.leaveEditAndRefresh = function () {
        var objects = this.visualizer.leaveEditMode();
        var newdefinition = {};
        newdefinition.objects = objects;
        this.destroyScene();
        this.createScene(JSON.stringify(newdefinition));
        this.goHome();
    };
    AzureLens.prototype.notImplemented = function () {
        window.alert("This feature hasn't been implemented yet. Help us build it!");
    };
    AzureLens.prototype.closePopup = function () {
        $("#popupDiv").hide();
    };
    AzureLens.prototype.popupExpand = function () {
        this.expandedClose(false);
        var expandedPopupDiv = $("#expandedPopupDiv");
        expandedPopupDiv.show();
        expandedPopupDiv.velocity("transition.expandIn", 100);
        this.menu.multilevelpushmenu('collapse');
    };
    AzureLens.prototype.expandedClose = function (animate) {
        if (animate === void 0) { animate = true; }
        this.closePopup();
        var self = this;
        var elementsToHide = [
            "textPropertiesPanel",
            "arrowPropertiesPanel",
            "boxPropertiesPanel",
            "imagePropertiesPanel",
            "editPropertiesPanel",
            "fileOpenPanel"
        ];
        if (animate) {
            $("#popupAddingObject").velocity("transition.slideRightOut", 350);
            $("#editPropertiesPanel").velocity("transition.slideRightOut", 350);
            $("#expandedPopupDiv").velocity("transition.expandOut", { duration: 150, delay: 200 });
        }
        elementsToHide.forEach(function (val) {
            $('#' + val).hide();
        });
        var div = document.getElementById("saveButtons");
        div.style.display = "";
    };
    AzureLens.prototype.destroyScene = function () {
        if (this._canvas != null) {
            this.visualizer.destroyScene();
            this._definition = null;
            this._canvas = null;
            this._objects = {};
            this.selectedItem = null;
        }
    };
    AzureLens.prototype.createScene = function (sceneData) {
        this._canvas = document.getElementById("renderCanvas");
        var data = JSON.parse(sceneData);
        this._definition = data;
        this.visualizer.createScene(this._definition, this._canvas);
        //Diagrams menu
        var diagramMenu = this.menu.multilevelpushmenu('finditemsbyname', 'Diagrams').first();
        this.menu.multilevelpushmenu('removeitems', diagramMenu);
        var $addTo = this.menu.multilevelpushmenu('findmenusbytitle', 'Browse').first();
        var addItems = [{
                name: 'Diagrams',
                icon: '',
                link: '#',
                items: [
                    {
                        title: 'Diagrams',
                        icon: '',
                        link: '#',
                        items: []
                    }]
            }];
        addItems[0].items[0].items.unshift({
            name: "Upload your own diagram",
            icon: '',
            link: '#ni'
        });
        addItems[0].items[0].items.unshift({
            name: "How-old.Net architecture",
            icon: '',
            link: '#diagFaceDemo.json'
        });
        addItems[0].items[0].items.unshift({
            name: "AzureLens architecture",
            icon: '',
            link: '#diagAzureLens.json'
        });
        this.menu.multilevelpushmenu('additems', addItems, $addTo, 3);
        //Navigate menu
        var navigateMenu = this.menu.multilevelpushmenu('finditemsbyname', 'Navigate').first();
        this.menu.multilevelpushmenu('removeitems', navigateMenu);
        $addTo = this.menu.multilevelpushmenu('findmenusbytitle', 'AzureLens').first();
        var addItems2 = [{
                name: 'Navigate',
                icon: 'fa fa-eye',
                link: '#',
                items: [
                    {
                        title: 'Navigate',
                        icon: 'fa fa-eye',
                        link: '#',
                        items: []
                    }]
            }];
        data.objects.forEach(function (item) {
            if (item.pinnedToMenu == true) {
                addItems2[0].items[0].items.unshift({
                    name: item.menuName,
                    icon: '',
                    link: '#nav' + item.id
                });
            }
        });
        addItems2[0].items[0].items = addItems2[0].items[0].items.sort(function (a, b) {
            return a.name > b.name ? 1 : -1;
        });
        this.menu.multilevelpushmenu('additems', addItems2, $addTo, 1);
        this.menu.visible = true;
        this.menu.multilevelpushmenu('expand', this.menu.multilevelpushmenu('findmenusbytitle', 'Navigate').first());
        this.visualizer.resize(null);
        this.menu.multilevelpushmenu('redraw');
    };
    return AzureLens;
})();
//*********************************************************   
//   
//AzureLens.Net, https://github.com/MicrosoftDX/AzureLens 
//  
//Copyright (c) Microsoft Corporation  
//All rights reserved.   
//  
// MIT License:  
// Permission is hereby granted, free of charge, to any person obtaining  
// a copy of this software and associated documentation files (the  
// ""Software""), to deal in the Software without restriction, including  
// without limitation the rights to use, copy, modify, merge, publish,  
// distribute, sublicense, and/or sell copies of the Software, and to  
// permit persons to whom the Software is furnished to do so, subject to  
// the following conditions:  
// The above copyright notice and this permission notice shall be  
// included in all copies or substantial portions of the Software.  
// THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,  
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF  
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND  
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE  
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION  
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION  
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  
//   
//*********************************************************   

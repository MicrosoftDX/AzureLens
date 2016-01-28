// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.
///<reference path="typings/velocity-animate/velocity-animate.d.ts" />
///<reference path="IAppView.ts" />
///<reference path="app3DView.ts" />
class BoxData {
    public Image: string;
}

class CylinderData {
    public Image: string;
}

class ObjectData {
    public ID: string;
    public Type: string;
    public Meshes: BABYLON.Mesh[];
}
enum ARROW_TYPE {
    Simple,
    ArrowTip,
    ArrowTipBothEnds
}
enum BOX2D_TYPE {
    BorderOnly,
    Filled
}

enum BOX_TYPE {
    VM,
    WebSite,
    O365,
    GitRepo,
    GitHub,
    VSO,
    MachineLearning,
    HDInsight,
    StreamAnalytics,
    EventHubs
}

enum LOWBOX_TYPE {
    Server
}
enum TEXT_TYPE {
    Flat,
    Floating
}


enum IMAGE_TYPE {
    Flat,
    Floating
}

enum CYLINDER_TYPE {
    AzureCache,
    AzureSQL,
    DocumentDB,
    MySQL,
    SQLDataSync,
    SQLDatabase,
    BlobStorage
}

declare function prompt(title: any, value: any, callback: any): any;
    
declare function createADALInstance(): any;

class AzureLens {
    private _definition;
    private _objects = {};
    private selectedItem = null;
    private menu = null;
    private visualizer: IAppView;
    private _canvas: HTMLCanvasElement;
    private authContext = createADALInstance();

    public login() {
        if (!this.authContext.getCachedUser()) {
            this.authContext.config.redirectUri = window.location.href;
            this.authContext.login();
            return;
        };
    }

    public logOut() {
        this.authContext.logOut();
    }

    public isUserLoggedIn(callback) {
        this.authContext.acquireToken(this.authContext.config.clientId, (error, token) => {
            if (token != null)
                callback(true);
            else
                callback(false);

        });
    }
    public goHome() {
        if (this._definition != null) {
            if (this._definition.objects.length > 0) {
                this.visualizer.navigateToMesh(this._definition.objects[0]);
            }
        }
    }
    public enterEditMode() {      
        this.isUserLoggedIn((result) => {
            if (result) {
                  this.visualizer.enterEditMode();
            } else {
               window.alert("Please login first");
            }
        });
    }

    constructor() {
        this.isUserLoggedIn((result) => {
            if (result) {
                $('#userSignOut').show();
                $('#userSignIn').hide();
                var userInfo = this.authContext.getCachedUser();
                $('#userEmailAddress').text(userInfo.profile.unique_name);
                $("#userWelcome").show();
            } else {
                $('#userSignOut').hide();
                $('#userSignIn').show();
                $("#userWelcome").hide();
            }
        });

        $('#userSignIn').click( ()=> {
            $('#userSignOut').show();
            $('#userSignIn').hide();
            this.login();
        });

        $('#userSignOut').click(() => {
            this.logOut();
        });

        this._objects = {};
        this.visualizer = new app3DView();
        this.visualizer.displayPopup = this.displayPopup.bind(this);
        document.getElementById("popupExpand").addEventListener("click",(evt) => { this.popupExpand(); });
        document.getElementById("expandedClose").addEventListener("click", (evt) => { this.expandedClose(); });

        var colorEditor: any = $("#arrowColor");
        colorEditor.spectrum({
           
        });

        colorEditor = $("#textColor");
        colorEditor.spectrum({

        });

        colorEditor = $("#boxColor");
        colorEditor.spectrum({

        });

        window.addEventListener('click', (evt) => {
            this.visualizer.click(evt);
        });

        window.addEventListener('keyup', (evt) => {
            this.visualizer.keyUp(evt);
        }, false);

        window.addEventListener('keydown', (evt) => {
            this.visualizer.keyDown(evt);
        }, false);

        window.addEventListener('mousedown', (evt) => {
            this.visualizer.mouseDown(evt);
        }, false); 
         
        window.addEventListener('pointerdown', (evt) => {
            this.visualizer.pointerDown(evt);
        }, false);
        window.addEventListener('pointermove', (evt) => {
            this.visualizer.pointerMove(evt);
        }, false);

        window.addEventListener('pointerup', (evt) => {
            this.visualizer.pointerUp(evt);
        }, false);


        window.addEventListener("resize", () => {
            if (this._canvas != null) {
                this._canvas.width = window.innerWidth;
                this._canvas.height = window.innerHeight;
            }
            this.visualizer.resize(null);
            
            if (this.menu != null) {
                this.menu.multilevelpushmenu('redraw');
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
            onExpandMenuStart: () => {
                this.expandedClose();
            },
            onItemClick: (a: any, b: any, args: any[]) => {

                this.expandedClose();
                this.closePopup();
                var element: HTMLElement = args[0];
                var anchor: HTMLAnchorElement = <HTMLAnchorElement>element.firstElementChild;

                if (anchor.href.indexOf('#nav') > 0) {
                    //Navigation menus

                    var id = anchor.href.substr(anchor.href.indexOf('#nav') + 4,
                        anchor.href.length - anchor.href.indexOf('#nav') - 4);
                    //this.manualMode = false;
                    var value = id;
                    this._definition.objects.forEach((item) => {
                        if (value == item.id) {

                            this.visualizer.navigateToMesh(item);
                        }
                    });
                    window.event.cancelBubble = true;
                } else if (anchor.href.indexOf('diag') > 0) {
                    //Diagram menus
                    var id = anchor.href.substr(anchor.href.indexOf('#diag') + 5,
                        anchor.href.length - anchor.href.indexOf('#diag') - 5);
                    this.loadDiagram(id);
                } else if (anchor.href.indexOf('#save') > 0) {
                    this.saveDiagram();
                } else if (anchor.href.indexOf('#edit') > 0) {
                    if (!this.visualizer.isEditing())
                        this.enterEditMode();
                    else {
                        this.leaveEditAndRefresh();
                    }
                } else if (anchor.href.indexOf('#goHome') > 0) {
                    this.goHome();
                }
                else if (anchor.href.indexOf('#download') > 0) {
                    this.showDownloads();
                }
                else if (anchor.href.indexOf('#openfile') > 0) {
                    a.preventDefault();
                    var input = <HTMLInputElement>anchor.nextElementSibling;
                    var fileReader = new FileLoader(input);
                    fileReader.openLocal((doc) => {
                        this.createScene(doc.contents);
                    });
                } else if (anchor.href.indexOf('#fileNew') > 0) {
                    this.newDiagram();
                } else if (anchor.href.indexOf('#fileshare') > 0) {
                    this.shareDiagram();
                } else if (anchor.href.indexOf('#openserver') > 0) {
                    this.openFromServer();
                }
                else {
                    this.notImplemented();
                }
            }
        });
        var btn = null;

        //Delete button
        btn = document.getElementById('btnDelete');
        btn.addEventListener("click", (evt) => {
            if (this.visualizer.deleteObject()) {
                this.closePopup();
            }
        });

        //Add button
        btn = document.getElementById('btnAdd');
        btn.addEventListener("click", (evt) => {
            $("#popupEditButtons").hide();
            $('#popupDescription').hide();
            $('#incompleteMessage').hide();
            this.popupExpand();
            $('#popupAddingObject').velocity('transition.slideRightIn', { duration: 350, delay: 100 });
            //$("popupAddingObject").velocity("transition.bounceRightIn", 1250); // need TS definition, pull from MEEportal
            //Also disable/remove/overlay other buttons while in Add etc
        });

        var ul = document.getElementById('listViewResources');
        ul.onclick = (event: MouseEvent) => {
            var t: Element = event.srcElement;
            var objType: string = "";
            if (t.attributes["id"] == null)
                objType = t.parentElement.attributes["id"].value.replace('listViewResources', '');
            else
                objType = t.attributes["id"].value.replace('listViewResources', '');
            this.visualizer.addObject(objType);
            this.expandedClose();
            $('#popupEditButtons').show();
            $('#popupDescription').show();
        };

        //Edit properties button

        btn = document.getElementById('btnProperties');
        btn.addEventListener("click", (evt) => {
            $('#incompleteMessage').hide();
            $('#editPropertiesPanel').velocity('transition.slideRightIn', 350);
            this.visualizer.showPropertyEditor();
            this.popupExpand();
        });
        //Save properties button
        btn = document.getElementById('propertiesSave');
        btn.addEventListener("click", (evt) => {
            if (this.visualizer.saveProperties()) {
                $('#incompleteMessage').show();
                $('#editPropertiesPanel').hide();
                this.expandedClose();
            }
        });

        //Cancel properties edit button
        btn = document.getElementById('propertiesCancel');
        btn.addEventListener("click", (evt) => {
            this.expandedClose();
        });
    }

    public newDiagram() {
        this.loadDiagram("New.json");
    }

    public loadDiagram(id) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", "SampleModels/" + id, true);
        xmlhttp.onreadystatechange = () => {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                this.destroyScene();
                this.createScene(xmlhttp.responseText);
            }
        }
        xmlhttp.send();
    }

    public loadUserDiagram(id) {
        this.authContext.acquireToken(this.authContext.config.clientId, (error, token) => {
            $.ajax({
                type: "GET",
                url: "services/v1/diagrams/" + id,
                dataType: 'json',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            }).done((result) => {
                this.destroyScene();
                this.createScene(JSON.stringify(result));
            });
        });
    }

    public shareDiagram() {
        if (this._definition.id == null) {
            window.alert("You can only share a diagram you have saved");
            return;
        }
        this.isUserLoggedIn((result) => {
            if (result) {
                var authContext = createADALInstance();
                authContext.acquireToken(authContext.config.clientId, (error, token) => {
                    var token = token;

                    $.ajax({
                        type: "POST",
                        url: "services/v1/diagrams/" + this._definition.id + "/share",
                        dataType: 'json',
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    }).done((result) => {
                        prompt("Here's the URL for your shared diagram", "http://www.azurelens.net/?share=" + result, (nothing) => {
                        });
                    });
                });
            } else {
                window.alert("Please login first");

            }
        });
    }

    public performOperationOnUserDiagrams(callback) {
        this.isUserLoggedIn((result) => {
            if (result) {
                this.authContext.acquireToken(this.authContext.config.clientId, (error, token) => {
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
            } else {
                window.alert("Please login first");
            }
        });
    }

    public openFromServer() {
        var self = this;
        this.performOperationOnUserDiagrams(function (result) {
            self.popupExpand();
            $("#fileOpenPanel").show();
            $("#incompleteMessage").hide();

            var list: HTMLDivElement = <HTMLDivElement>document.getElementById("listViewFiles");
            list.innerHTML = "";
            result.forEach((file) => {
                var docElement = document.createElement("div");
                docElement.appendChild(document.createTextNode(file.name));
                docElement.addEventListener("click", (evt) => {
                    self.loadUserDiagram(file.id);
                });
                list.appendChild(docElement);
            });
        });
    }

    public showDownloads() {
        var self = this;
        this.performOperationOnUserDiagrams(function (result) {
            self.popupExpand();
            $("#fileDownloadPanel").show();
            $("#incompleteMessage").hide();

            var list: HTMLDivElement = <HTMLDivElement>document.getElementById("listViewFiles2");
            list.innerHTML = "";
            result.forEach((file) => {
                var anchor = document.createElement("a");
                anchor.text = file.name;
                self.authContext.acquireToken(self.authContext.config.clientId, (error, token) => {
                    anchor.href = "services/v1/file/" + file.id + "?token=" + token;
                });
                anchor.setAttribute("download", "diagram.json");
                list.appendChild(anchor);
            });
        });
    }

    public saveDiagram() {
        this.isUserLoggedIn((authResult) => {
            if (authResult) {

                if (this._definition.id != null) {//update
                    var definition: any = this._definition;
                    var diagram = JSON.stringify(definition);
                    var resource = this.authContext.getResourceForEndpoint(window.location.href);
                    var token = this.authContext.getCachedToken(resource);

                    $.ajax({
                        type: "PUT",
                        url: "services/v1/diagrams/" + this._definition.id,
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
                else {//insert
                    prompt("Please enter the name of the diagram", "diagram1", (result) => {
                        if (result === null) {
                            return;
                        } else {
                            var definition: any = this._definition;

                            definition.name = result;
                            var diagram = JSON.stringify(definition);
                            var resource = this.authContext.getResourceForEndpoint(window.location.href);
                            var token = this.authContext.getCachedToken(resource);

                            $.ajax({
                                type: "POST",
                                url: "services/v1/diagrams/",
                                dataType: 'json',
                                contentType: 'application/json',
                                data: diagram,
                                headers: {
                                    'Authorization': 'Bearer ' + token
                                }
                            }).done((result) => {
                                this._definition.id = result;
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
    }

    

    public displayPopup(item, editing: boolean, visualizer: IAppView) {
        var popupDiv: HTMLDivElement = <HTMLDivElement>document.getElementById("popupDiv");
        var popupName: HTMLDivElement = <HTMLDivElement>document.getElementById("popupName");
        var popupDescription: HTMLDivElement = <HTMLDivElement>document.getElementById("popupDescription");
        var popupButtons: HTMLDivElement = <HTMLDivElement>document.getElementById("popupButtons");

        if (item.description != null || editing) {
            $("#popupDiv").velocity("transition.slideRightIn", 250);
            popupName.innerText = "Name: " + item.id;
            popupDescription.innerText = item.description;
            popupDescription.style.display = "";

            popupButtons.innerHTML = "";

            if (editing) {
                $('#popupEditButtons').show();
            } else {
                $('#popupEditButtons').hide();
            }
        } else
            popupDiv.style.display = "none";
    }

    public leaveEditAndRefresh() {
        var objects: any[] = this.visualizer.leaveEditMode();
        var newdefinition: any = {};
        newdefinition.objects = objects;
        this.destroyScene();
        this.createScene(JSON.stringify(newdefinition));
        this.goHome();
    }

    public notImplemented() {
        window.alert("This feature hasn't been implemented yet. Help us build it!");
    }

    public closePopup() {
        $("#popupDiv").hide();
    }

    public popupExpand() {
        this.expandedClose(false);
        var expandedPopupDiv = $("#expandedPopupDiv");
        expandedPopupDiv.show();
        expandedPopupDiv.velocity("transition.expandIn", 100);
        this.menu.multilevelpushmenu('collapse');
    }

    public expandedClose(animate=true) {
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
    }

    public destroyScene() {
        if (this._canvas != null) {
            this.visualizer.destroyScene();
            this._definition = null;
            this._canvas = null;
            this._objects = {};
            this.selectedItem = null;
        }
    }

    public createScene(sceneData: string) {
        this._canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");
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
                    items: [
                    ]
                }]
        }];

        addItems[0].items[0].items.unshift(
            {
                name: "Upload your own diagram",
                icon: '',
                link: '#ni'
            });

        addItems[0].items[0].items.unshift(
            {
                name: "How-old.Net architecture",
                icon: '',
                link: '#diagFaceDemo.json'
            });

        addItems[0].items[0].items.unshift(
            {
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
                    items: [
                    ]
                }]
        }];

        data.objects.forEach((item) => {
            if (item.pinnedToMenu == true) {
                addItems2[0].items[0].items.unshift(
                    {
                        name: item.menuName,
                        icon: '',
                        link: '#nav' + item.id
                    });
            }
        });
        addItems2[0].items[0].items = addItems2[0].items[0].items.sort(function (a, b) {
            return a.name > b.name ? 1 : -1
        });

        this.menu.multilevelpushmenu('additems', addItems2, $addTo, 1);
        this.menu.visible = true;
        this.menu.multilevelpushmenu('expand', this.menu.multilevelpushmenu('findmenusbytitle', 'Navigate').first());

        this.visualizer.resize(null);

        this.menu.multilevelpushmenu('redraw');
    }


}
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

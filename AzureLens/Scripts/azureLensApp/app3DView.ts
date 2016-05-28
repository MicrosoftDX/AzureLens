// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.
///<reference path="typings/babylon.d.ts" />
///<reference path="typings/jquery/jquery.d.ts" />
///<reference path="IAppView.ts" />
class app3DView implements IAppView  {
    private _definition;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private BOX_SIZE: number = 6;
    private PLANE_SIZE: number = 600;
    private _camera: BABYLON.TouchCamera;
    private _cameraHidden: BABYLON.TouchCamera;
    private _arcCamera: BABYLON.ArcRotateCamera;
    private _basePlane: BABYLON.Mesh;
    private _light: BABYLON.HemisphericLight;
    private _lightPoints: BABYLON.PointLight[];
    private _objects = {};
    private targetPosition: BABYLON.Vector3;
    private targetLookat: BABYLON.Vector3;
    private manualMode: boolean = false;
    private _canvas: HTMLCanvasElement;
    private _editing: boolean = false;
    private _movingObject: boolean = false;
    private _selectedObject = null;
    private _selectedMeshes: BABYLON.AbstractMesh[] = null;
    private _dragging: boolean = false;
    private originalPosition: BABYLON.Vector3;
    private _dragStartPosition: BABYLON.Vector3 = null;
    private _selectedSphere: BABYLON.AbstractMesh = null;
    private timeout = null;
    public displayPopup: (item, editing: boolean, visualizer: IAppView) => void;
    private VMUpdater = null;
    private VMEnabled: boolean = false;

    private updateVM() {
        if (!this._editing) {
            if (this._definition != null) {
                this._definition.objects.forEach((item) => {
                    if (item.id == "SampleVM") {
                        var mesh: BABYLON.AbstractMesh = this._scene.getMeshByID(item.id);
                        this.VMEnabled = !this.VMEnabled;
                        if (this.VMEnabled) {
                            (<BABYLON.StandardMaterial>(<BABYLON.MultiMaterial>mesh.material).subMaterials[1]).diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                        } else
                        {
                                (<BABYLON.StandardMaterial>(<BABYLON.MultiMaterial>mesh.material).subMaterials[1]).diffuseColor = new BABYLON.Color3(1, 0, 0);
                            } 

                    }
                });
            }
        }

    }

    private moving = {
        down: false,
        up: false,
        left: false,
        right: false,
        front: false,
        back: false
    }

    private rotating = {
        down: false,
        up: false,
        left: false,
        right: false
    }
    
    public enterEditMode() {
        window.alert("The editor is a very early draft. It has bugs and unfinished features. We are working on it so hang in there :)");
        this._editing = true;
        (<BABYLON.StandardMaterial>this._basePlane.material).diffuseColor = new BABYLON.Color3(0.54, 0.53, 0.79);
        document.getElementById('editMenuLink').innerHTML = "Exit Edit Mode";
        document.getElementById('rightUnselectedDiv').setAttribute('id', 'rightSelectedDiv');
        document.getElementById('btnAdd').style.display = "inline-block";
        this._arcCamera.position = this._camera.position;
        this._arcCamera.rotation = this._camera.rotation;
        this._scene.setActiveCameraByName("Camera3");
    }

    public leaveEditMode(): any[]{
        this.destroySpheres();
        this._editing = false;
        (<BABYLON.StandardMaterial>this._basePlane.material).diffuseColor = new BABYLON.Color3(0, 0, 1);
        document.getElementById('editMenuLink').innerHTML = "Enter Edit Mode";
        document.getElementById('rightSelectedDiv').setAttribute('id', 'rightUnselectedDiv');
        document.getElementById('btnAdd').style.display = "none";
        document.getElementById('popupEditButtons').style.display = "none";
        this._scene.setActiveCameraByName("Camera");        
        return this._definition.objects;     
    }

    public isEditing(): boolean {
        return this._editing;
    }
    
    public startMovingObject() {
        this._movingObject = true;
    }

    public deleteObject() {
        var txt;
        var r = window.confirm("Are you sure you want to delete the object?");
        var id = this._selectedObject.id;
        if (r == true) {
            var meshes: BABYLON.AbstractMesh[] = this._scene.getMeshesByTags(id);
            meshes.forEach((mesh) => {
                this._scene.removeMesh(mesh);
                mesh.dispose();
            });


            var newItems = [];
            this._definition.objects.forEach((item) => {
                if (item.id != id) {
                    newItems.push(item);
                }
            });
            this._definition.objects = newItems;

               

            //TODO: Fix the navigation menus after delete
           
            return true;
        } else
            return false;
    }
    public showPropertyEditor() {
        var imgURL = this.createEditImage(this._selectedObject.type);
        var imgItem = document.getElementById("editImageItem");
        if (imgURL == null) {
            imgItem.setAttribute("style", "display:none");
        }
        else {
            imgItem.setAttribute("style", "display:block");
            imgItem.setAttribute("src", imgURL);
        }
        var txt: HTMLInputElement = <HTMLInputElement>document.getElementById("editID");
        txt.value = this._selectedObject.id;
        txt = <HTMLInputElement>document.getElementById("editDescription");
        txt.value = this._selectedObject.description != null ? this._selectedObject.description : "";
        txt = <HTMLInputElement>document.getElementById("editPin");
        txt.checked = this._selectedObject.pinnedToMenu != null ? this._selectedObject.pinnedToMenu : false;
        txt = <HTMLInputElement>document.getElementById("editMenuName");
        txt.value = this._selectedObject.menuName != null ? this._selectedObject.menuName : "";
        var x: string;

        var div: HTMLDivElement; 
       
        div = <HTMLDivElement>document.getElementById("textPropertiesPanel");

        if (this._selectedObject.type == "TEXT_TYPE.Flat" ||
            this._selectedObject.type == "TEXT_TYPE.Floating") {
            div.style.display = "";
            txt = <HTMLInputElement>document.getElementById("editFontSize");
            txt.value = this._selectedObject.fontSize;
            txt = <HTMLInputElement>document.getElementById("editText");
            txt.value = this._selectedObject.text;

            var textColor: any = $("#textColor");

            textColor.spectrum("set", { "r": this._selectedObject.color4[0] * 255, "g": this._selectedObject.color4[1] * 255, "b": this._selectedObject.color4[2] * 255 });
              


        } else if (this._selectedObject.type == "ARROW_TYPE.ArrowTip" ||
            this._selectedObject.type == "ARROW_TYPE.ArrowTipBothEnds") {

             
            div = <HTMLDivElement>document.getElementById("arrowPropertiesPanel");
            div.style.display = "";

            txt = <HTMLInputElement>document.getElementById("arrowTipBothEnds");
            txt.checked = (this._selectedObject.type == "ARROW_TYPE.ArrowTipBothEnds");

            var arrowColor: any = $("#arrowColor");

            arrowColor.spectrum("set", { "r": this._selectedObject.color4[0] * 255, "g": this._selectedObject.color4[1] * 255, "b": this._selectedObject.color4[2] * 255 });
                    

        } else if (this._selectedObject.type == "BOX2D_TYPE.BorderOnly" ||
            this._selectedObject.type == "BOX2D_TYPE.Filled") {
   

            div = <HTMLDivElement>document.getElementById("boxPropertiesPanel");
            div.style.display = "";

            var boxColor: any = $("#boxColor");

            boxColor.spectrum("set", { "r": this._selectedObject.color4[0] * 255, "g": this._selectedObject.color4[1] * 255, "b": this._selectedObject.color4[2] * 255 });


        } else if (this._selectedObject.type == "IMAGE_TYPE.Floating" ||
            this._selectedObject.type == "IMAGE_TYPE.Flat") {


            div = <HTMLDivElement>document.getElementById("imagePropertiesPanel");
            div.style.display = "";

            txt = <HTMLInputElement>document.getElementById("imageURL");
            txt.value = this._selectedObject.image;

            txt = <HTMLInputElement>document.getElementById("floatingImage");
            txt.checked = (this._selectedObject.type == "IMAGE_TYPE.Floating");

            txt = <HTMLInputElement>document.getElementById("imageHeight");
            txt.value = this._selectedObject.height;

            txt = <HTMLInputElement>document.getElementById("imageSize");
            txt.value = this._selectedObject.size;

        }
        else {
            div.style.display = "none";
        }

    }

    public createEditImage(itemType) {

        var cylinderDict = CYLINDER_TYPE.valueOf();
        var boxDict = BOX_TYPE.valueOf();

        switch (itemType.split(".")[1]) {

            case cylinderDict[CYLINDER_TYPE.AzureCache]:
                return "assets/logos/Azure Cache including Redis.png";
            case cylinderDict[CYLINDER_TYPE.AzureSQL]:
                return "assets/logos/Azure SQL Database.png";
            case cylinderDict[CYLINDER_TYPE.DocumentDB]:
                return "assets/logos/DocumentDB.png";
            case cylinderDict[CYLINDER_TYPE.MySQL]:
                return "assets/logos/MySQL database.png";
            case cylinderDict[CYLINDER_TYPE.SQLDatabase]:
                return "assets/logos/SQL Database (generic).png";
            case cylinderDict[CYLINDER_TYPE.SQLDataSync]:
                return "assets/logos/SQL Data Sync.png";
            case cylinderDict[CYLINDER_TYPE.BlobStorage]:
                return "assets/logos/Storage Blob.png";
            case boxDict[BOX_TYPE.VM]:
                return "assets/logos/VM symbol only.png";
            case boxDict[BOX_TYPE.WebSite]:
                return "assets/logos/Azure Websites.png";
            case boxDict[BOX_TYPE.O365]:
                return "assets/logos/Office 365.png";
            case boxDict[BOX_TYPE.GitRepo]:
                return "assets/logos/Git repository.png";
            case boxDict[BOX_TYPE.GitHub]:
                return "assets/logos/GitHub.png";
            case boxDict[BOX_TYPE.VSO]:
                return "assets/logos/Visual Studio Online.png";
            case boxDict[BOX_TYPE.MachineLearning]:
                return "assets/logos/Machine Learning.png";
            case boxDict[BOX_TYPE.HDInsight]:
                return "assets/logos/HDInsight.png";
            case boxDict[BOX_TYPE.StreamAnalytics]:
                return "assets/logos/Stream Analytics.png";
            case boxDict[BOX_TYPE.EventHubs]:
                return "assets/logos/Event Hubs.png";
            default: return null;

        }

    }
    public saveProperties(): boolean {

        var txt: HTMLInputElement = <HTMLInputElement>document.getElementById("editID");
        if (!this.validateID(txt.value)){
            return false;
        }
        this._selectedObject.id = txt.value; //TODO: validate if ID is ok
        txt = <HTMLInputElement>document.getElementById("editDescription");
        this._selectedObject.description = txt.value;
        txt = <HTMLInputElement>document.getElementById("editPin");
        this._selectedObject.pinnedToMenu = txt.checked;
        txt = <HTMLInputElement>document.getElementById("editMenuName");
        this._selectedObject.menuName = txt.value;

        if (this._selectedObject.type == "TEXT_TYPE.Flat" ||
            this._selectedObject.type == "TEXT_TYPE.Floating") {
           
            txt = <HTMLInputElement>document.getElementById("editFontSize");
            this._selectedObject.fontSize = txt.value;
            txt = <HTMLInputElement>document.getElementById("editText");
            this._selectedObject.text = txt.value;

            var textColor: any = $("#textColor");

            var color = textColor.spectrum("get");

            this._selectedObject.color4[0] = color._r / 255;
            this._selectedObject.color4[1] = color._g / 255;
            this._selectedObject.color4[2] = color._b / 255;


        } else if (this._selectedObject.type == "ARROW_TYPE.ArrowTip" ||
            this._selectedObject.type == "ARROW_TYPE.ArrowTipBothEnds") {

            var arrowColor: any = $("#arrowColor");

            var color = arrowColor.spectrum("get");

            this._selectedObject.color4[0] = color._r / 255;
            this._selectedObject.color4[1] = color._g / 255;
            this._selectedObject.color4[2] = color._b / 255;

            txt = <HTMLInputElement>document.getElementById("arrowTipBothEnds");
            if (txt.checked) {
                this._selectedObject.type = "ARROW_TYPE.ArrowTipBothEnds";
            } else
                this._selectedObject.type = "ARROW_TYPE.ArrowTip";

        } else if (this._selectedObject.type == "BOX2D_TYPE.BorderOnly" ||
            this._selectedObject.type == "BOX2D_TYPE.Filled") {


            var boxColor: any = $("#boxColor");

            var color = boxColor.spectrum("get");

            this._selectedObject.color4[0] = color._r / 255;
            this._selectedObject.color4[1] = color._g / 255;
            this._selectedObject.color4[2] = color._b / 255;

        } else if (this._selectedObject.type == "IMAGE_TYPE.Floating" ||
            this._selectedObject.type == "IMAGE_TYPE.Flat") {

            txt = <HTMLInputElement>document.getElementById("imageURL");
            this._selectedObject.image = txt.value;

            txt = <HTMLInputElement>document.getElementById("floatingImage");
            if (txt.checked) {
                this._selectedObject.type = "IMAGE_TYPE.Floating";
            } else {
                this._selectedObject.type = "IMAGE_TYPE.Flat";
            }

            txt = <HTMLInputElement>document.getElementById("imageHeight");
            this._selectedObject.height = parseFloat(txt.value);

            txt = <HTMLInputElement>document.getElementById("imageSize");
            this._selectedObject.size = parseFloat(txt.value);

        }
        this.updateItem(this._selectedObject);
        return true;

    }

    public validateID(id: string): Boolean {
        if (id.indexOf(' ') >= 0) {
            window.alert("ID can't contain spaces");
            return false;
        }

        this._definition.objects.forEach((item) => {
            if (item.id == id && !(item === this._selectedObject)) {
                window.alert("The ID:" + item.id + " is already being used. IDs have to be unique.");
                return false;
            }
        });
        return true;

    }

    public stopMovingObject() {
        this._movingObject = false;
    }

    public destroySpheres() {

        var meshes: BABYLON.AbstractMesh[] = this._scene.getMeshesByTags("azurelensauxpoint");
        meshes.forEach((mesh) => {
            this._scene.removeMesh(mesh);
            mesh.dispose();
        });
        this._selectedSphere = null;
                
    }

    public navigateToMesh(item) {
        this.destroySpheres();
        this._selectedObject = item;

        this.displayPopup(item, this._editing, this);
        var height: number = item.height == null ? 0 : item.height;
        var position: BABYLON.Vector3;
        var lookAt: BABYLON.Vector3;
        if (item.position2 != null) {
            position = new BABYLON.Vector3(item.position2.x, height + 35, item.position2.y - 50);
            lookAt = new BABYLON.Vector3(item.position2.x, height, item.position2.y);
        } else {
            position = new BABYLON.Vector3(item.points2[0].x, height + 35, item.points2[0].y - 50);
            lookAt = new BABYLON.Vector3(item.points2[0].x, height, item.points2[0].y);
        }
        this.targetPosition = position;
        this.targetLookat = lookAt;

        this.manualMode = false;

        if (this._editing) {
            this._scene.setActiveCameraByName("Camera");
         
            var p = null;
            var y = 0;
            if (item.type.replace('CYLINDER_TYPE') != item.type ||
                item.type.replace('BOX_TYPE') != item.type ||
                item.type.replace('LOWBOX_TYPE') != item.type 
                ) {
                y = 6;
            }

            if (item.position2 != null) {
                p = item.position2;
                var point: BABYLON.Vector3 = new BABYLON.Vector3(item.position2.x, y, item.position2.y);
                var sphere: BABYLON.Mesh = BABYLON.Mesh.CreateSphere("sphere", 10.0, 3.0, this._scene);
                sphere.position = point;
                sphere.material = new BABYLON.StandardMaterial("texture1", this._scene);
                (<BABYLON.StandardMaterial>sphere.material).emissiveColor = new BABYLON.Color3(1, 1, 0);
                sphere.isPickable = true;
                BABYLON.Tags.EnableFor(sphere);
                BABYLON.Tags.AddTagsTo(sphere, "azurelensauxpoint 0");
            } else {
                p = item.points2[0];
                for (var count = 0; count < item.points2.length;count++){

                    var point: BABYLON.Vector3 = new BABYLON.Vector3(item.points2[count].x, y, item.points2[count].y);
                    var sphere: BABYLON.Mesh = BABYLON.Mesh.CreateSphere("sphere", 10.0, 3.0, this._scene);
                    sphere.position = point;
                    sphere.material = new BABYLON.StandardMaterial("texture1", this._scene);
                    (<BABYLON.StandardMaterial>sphere.material).emissiveColor = new BABYLON.Color3(1,1, 0);
                    sphere.isPickable = true;
                    BABYLON.Tags.EnableFor(sphere);
                    BABYLON.Tags.AddTagsTo(sphere, "azurelensauxpoint " + count);

                }
            }
            this._arcCamera.dispose();
            this._arcCamera = new BABYLON.ArcRotateCamera("Camera3", 4.7, 0.5, 80, new BABYLON.Vector3(p.x, 35, p.y), this._scene);
            this.unFreezeArcCamera();
            this._arcCamera.attachControl(this._canvas, true);
            this._scene.setActiveCameraByName("Camera3");
        }
    }

    public click(evt) {
        this.manualMode = true;
        if (this._scene != null && !this._movingObject) {
            var pickResult: BABYLON.PickingInfo = this._scene.pick(evt.clientX, evt.clientY, (mesh) => {
                var m = null;
                this._definition.objects.forEach((item) => {
                    if (item.id == mesh.id && (item.position2 != null || item.points2 != null)) {
                        if (item.description != null || this._editing)
                            m= mesh;
                    }
                });
                if (m != null)
                    return true;
                else
                    return false;
            });

            if (pickResult.hit) {
                this.handleObjectClick(pickResult);
            }
        }
    }

    public keyUp(evt) {
        switch (evt.keyCode) {
            case 37:
                this.moving.left = false;
                break;
            case 38:
                this.moving.front = false;
                break;
            case 39:
                this.moving.right = false;
                break;
            case 40:
                this.moving.back = false;
                break;
        }
    }

    public keyDown(evt) {
        this.manualMode = true;
        switch (evt.keyCode) {
            case 37:
                this.moving.left = true;
                break;
            case 38:
                this.moving.front = true;
                break;
            case 39:
                this.moving.right = true;
                break;
            case 40:
                this.moving.back = true;
                break;
        }
    }
    public freezeArcCamera() {
        console.log("Freeze camera");
        if (this.timeout != null) window.clearTimeout(this.timeout);
        this.timeout = null;
        this._arcCamera.lowerAlphaLimit = this._arcCamera.alpha;
        this._arcCamera.upperAlphaLimit = this._arcCamera.alpha;
        this._arcCamera.lowerBetaLimit = this._arcCamera.beta;
        this._arcCamera.upperBetaLimit = this._arcCamera.beta;
        this._arcCamera.lowerRadiusLimit = this._arcCamera.radius;
        this._arcCamera.upperRadiusLimit = this._arcCamera.radius;     
    }

    public unFreezeArcCamera() {
        console.log("Unfreeze camera");
        this.timeout = window.setInterval((evt) => {
            if (this.timeout!=null) window.clearTimeout(this.timeout);
            this.timeout = null;
           // this._arcCamera.angularSensibility=2000;
            this._arcCamera.panningSensibility=250;
            this._arcCamera.lowerAlphaLimit = null;
            this._arcCamera.upperAlphaLimit = null;
            this._arcCamera.lowerBetaLimit = 0.01;
            this._arcCamera.upperBetaLimit = 1; //So the camera doesn't ever move below ground level
            this._arcCamera.lowerRadiusLimit = null;
            this._arcCamera.upperRadiusLimit = null;
        }, 500);     
    }

    public dragStart(pointID:any) {
        this.freezeArcCamera();
        this._dragging = true;
        this.originalPosition = new BABYLON.Vector3(this._selectedSphere.position.x, this._selectedSphere.position.y, this._selectedSphere.position.z);
        //for (var count = 0; count < this._selectedMeshes.length; count++){
        //    this.originalPositions[count] = new BABYLON.Vector3(this._selectedMeshes[count].position.x, this._selectedMeshes[count].position.y, this._selectedMeshes[count].position.z);
        //}
    }

    public pointerMove(evt) {
        if (this._dragging) {
            var pick = this._scene.pick(evt.clientX, evt.clientY);
            this._selectedSphere.position.x = this.originalPosition.x + (pick.pickedPoint.x - this._dragStartPosition.x);
            this._selectedSphere.position.z = this.originalPosition.z + (pick.pickedPoint.z - this._dragStartPosition.z);


            //for (var count = 0; count < this._selectedMeshes.length; count++) {
            //    if (this._movingPoint == null) {
            //        this._selectedMeshes[count].position.x = this.originalPositions[count].x + (pick.pickedPoint.x - this._dragStartPosition.x);
            //        this._selectedMeshes[count].position.z = this.originalPositions[count].z + (pick.pickedPoint.z - this._dragStartPosition.z);
            //    } else {
            //    }
            //}
        }
    }
    public updateItem(item) {
        var meshes: BABYLON.AbstractMesh[] = this._scene.getMeshesByTags(item.id);
        meshes.forEach((mesh) => {
            this._scene.removeMesh(mesh);
            mesh.dispose();
        });
        this.createItem(item);
        this.destroySpheres();

    }
    public pointerUp(evt) {
        if (this._dragging) {
            this._dragging = false;
            this.unFreezeArcCamera();
            event.stopPropagation();
            event.preventDefault();

            if (this._selectedObject.position2 != null) {
                this._selectedObject.position2.x = this._selectedSphere.position.x;
                this._selectedObject.position2.y = this._selectedSphere.position.z;
            }

            if (this._selectedObject.points2 != null) {

                var id = Object.keys(BABYLON.Tags.GetTags(this._selectedSphere))[0];
                this._selectedObject.points2[id].x = this._selectedSphere.position.x;
                this._selectedObject.points2[id].y = this._selectedSphere.position.z;
            }
            this.updateItem(this._selectedObject);
            return false;
        }
    }

    public mouseDown(evt) {
   
    }
   
   

    public pointerDown(evt) {
        this.manualMode = true;

        if (this._editing) {
            var pickResult: BABYLON.PickingInfo = this._scene.pick(evt.clientX, evt.clientY);
            if (pickResult.hit) {
                var mesh: BABYLON.AbstractMesh;
                this._selectedSphere = null;
                mesh = pickResult.pickedMesh;
                var mesh2: any = mesh;
                var pointID: any = null;
                var meshID: string = null;
                try {
                    if (mesh2.matchesTagsQuery("azurelensauxpoint")) {
                        var id = Object.keys(BABYLON.Tags.GetTags(mesh2))[0];
                        this._selectedSphere = mesh2;
                        pointID = id;
                        meshID = this._selectedObject.id;
                        
                    } else {
                        this._selectedSphere = null;
                        meshID = mesh.id;
                    }
                } catch (exception) {
                    this._selectedSphere = null;
                    meshID = mesh.id;
                }      


                var meshes: BABYLON.AbstractMesh[] = this._scene.getMeshesByTags(meshID);
                
                this._selectedMeshes = meshes;
                if (mesh != null) {
                    this._definition.objects.forEach((item) => {
                        if (item.id == meshID && (item.position2 != null || item.points2 != null) && this._selectedSphere != null) {
                            if (item.id == meshID) {
                                this._dragStartPosition = new BABYLON.Vector3(pickResult.pickedPoint.x, pickResult.pickedPoint.y, pickResult.pickedPoint.z);
                                this.dragStart(pointID);
                            }
                        }
                    });
                }
            }
        }
    }

    public resize() {
        this._canvas.width = window.innerWidth;
        this._canvas.height = window.innerHeight;
        if (this._engine != null) {
            this._engine.resize();
        }
    }

    constructor() {
        this._objects = {};
        this._lightPoints = [];
    }

    private createBasePlane() {
        this._basePlane = BABYLON.Mesh.CreateBox("floor", this.PLANE_SIZE, this._scene);
        this._basePlane.scaling.x = 1;
        this._basePlane.scaling.z = 1;
        this._basePlane.scaling.y = 0.001;

        var material0 = new BABYLON.StandardMaterial("mat0", this._scene);

        material0.diffuseTexture = new BABYLON.Texture("assets/Plane.png", this._scene);
        (<BABYLON.Texture>material0.diffuseTexture).wAng = Math.PI;
        (<BABYLON.Texture>material0.diffuseTexture).getAlphaFromRGB = false;
        (<BABYLON.Texture>material0.diffuseTexture).hasAlpha = false;
        (<BABYLON.Texture>material0.diffuseTexture).uScale = 200;
        (<BABYLON.Texture>material0.diffuseTexture).vScale = 200;
        material0.useAlphaFromDiffuseTexture = false;
        material0.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        this._basePlane.material = material0;
  
//        this._basePlane.material = new BABYLON.StandardMaterial("texture1", this._scene);
        (<BABYLON.StandardMaterial>this._basePlane.material).diffuseColor = new BABYLON.Color3(0, 0, 1);
        (<BABYLON.StandardMaterial>this._basePlane.material).specularColor = new BABYLON.Color3(1, 1, 1);
        this._basePlane.position = new BABYLON.Vector3(-100, 0, 100);
        this._basePlane.isPickable = true;
        this._basePlane.material.backFaceCulling = false;
    }
    
    private color3ToHex(color: BABYLON.Color3): string {
        var result = "#" + this.rgbToHex(color.r * 255) + this.rgbToHex(color.g * 255) + this.rgbToHex(color.b * 255);
        return result;
    }

    private rgbToHex(n: number): string {
        n = Math.max(0, Math.min(n, 255));
        return "0123456789ABCDEF".charAt((n - n % 16) / 16)
            + "0123456789ABCDEF".charAt(n % 16);
    }

    private createBaseBox(): BABYLON.Mesh {
        var box = BABYLON.Mesh.CreateBox("box", this.BOX_SIZE, this._scene);
        box.scaling.x = 1;
        box.scaling.z = 1;
        box.scaling.y = 1;
        box.position = new BABYLON.Vector3(-100, this.PLANE_SIZE * 0.001 + this.BOX_SIZE / 2, 100);
        box.isPickable = false;

        return box;
    }

    private createBaseCylinder(): BABYLON.Mesh {
        var cylinder = BABYLON.Mesh.CreateCylinder("cylinder", this.BOX_SIZE, this.BOX_SIZE, this.BOX_SIZE, 24, 1, this._scene);
        cylinder.scaling.x = 1;
        cylinder.scaling.z = 1;
        cylinder.scaling.y = 1;
        cylinder.position = new BABYLON.Vector3(-100, this.PLANE_SIZE * 0.001 + this.BOX_SIZE / 2, 100);
        cylinder.isPickable = false;

        return cylinder;
    }

    private setCylinder(cylinder: BABYLON.Mesh, cylinderType: CYLINDER_TYPE, id: string) {
        var data: CylinderData = new CylinderData();
        cylinder.isPickable = true;
        cylinder.id = id;
        BABYLON.Tags.EnableFor(cylinder);
        BABYLON.Tags.AddTagsTo(cylinder, id);
        switch (cylinderType) {
            case CYLINDER_TYPE.AzureCache:
                data.Image = "assets/logos/Azure Cache including Redis.png";
                break;
            case CYLINDER_TYPE.AzureSQL:
                data.Image = "assets/logos/Azure SQL Database.png";
                break;
            case CYLINDER_TYPE.DocumentDB:
                data.Image = "assets/logos/DocumentDB.png";
                break;
            case CYLINDER_TYPE.MySQL:
                data.Image = "assets/logos/MySQL database.png";
                break;
            case CYLINDER_TYPE.SQLDatabase:
                data.Image = "assets/logos/SQL Database (generic).png";
                break;
            case CYLINDER_TYPE.SQLDataSync:
                data.Image = "assets/logos/SQL Data Sync.png";
                break;
            case CYLINDER_TYPE.BlobStorage:
                data.Image = "assets/logos/Storage Blob.png";
                break;
            default:

                break;
        }

        var material0 = new BABYLON.StandardMaterial("mat0", this._scene);
       // material0.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        material0.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        // material0.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        material0.emissiveColor = new BABYLON.Color3(0, 0, 0.5);

        material0.emissiveTexture = new BABYLON.Texture(data.Image, this._scene, true, true);
        (<BABYLON.Texture>material0.emissiveTexture).uAng = Math.PI;
        (<BABYLON.Texture>material0.emissiveTexture).wAng = Math.PI;
       // (<BABYLON.Texture>material0.emissiveTexture).vAng = Math.PI;
        (<BABYLON.Texture>material0.emissiveTexture).getAlphaFromRGB = true;
        (<BABYLON.Texture>material0.emissiveTexture).hasAlpha = true;
        (<BABYLON.Texture>material0.emissiveTexture).uScale = 3.5;
        (<BABYLON.Texture>material0.emissiveTexture).uOffset = 0.77;
        (<BABYLON.Texture>material0.emissiveTexture).vOffset = 0;
        (<BABYLON.Texture>material0.emissiveTexture).vScale = 1.1;
        material0.useAlphaFromDiffuseTexture = false;
      //  material0.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
//        material0.ambientColor = new BABYLON.Color3(1, 1, 0);
//        material0.specularColor = new BABYLON.Color3(1, 1, 0);

        var material1 = new BABYLON.StandardMaterial("mat1", this._scene);
        //material1.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        material1.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        material1.emissiveColor = new BABYLON.Color3(0, 0, 0.5);
     
        var multimat = new BABYLON.MultiMaterial("multi", this._scene);
        multimat.subMaterials.push(material0);
        multimat.subMaterials.push(material1);

        cylinder.rotate(new BABYLON.Vector3(0, 1, 0), Math.PI * 1.75, BABYLON.Space.LOCAL);
        cylinder.material = multimat;
        cylinder.subMeshes = [];
        var verticesCount = cylinder.getTotalVertices();

        cylinder.subMeshes.push(new BABYLON.SubMesh(1, 0, verticesCount, 36, 232, cylinder));
        cylinder.subMeshes.push(new BABYLON.SubMesh(0, 0, verticesCount, 0, 36, cylinder));

    }

    private createCylinder(id: string, cylinderType: CYLINDER_TYPE, position: BABYLON.Vector2) {
        var cylinder = this.createBaseCylinder();
        this.setCylinder(cylinder, cylinderType, id);
        cylinder.position.x = position.x;
        cylinder.position.z = position.y;
        var o: ObjectData = new ObjectData();
        o.ID = id;
        o.Type = "CYLINDER_TYPE." + CYLINDER_TYPE[cylinderType].toString();
        o.Meshes = [cylinder];
        this._objects[id] = o;
    }

    private createLowBox(id: string, lowboxType: LOWBOX_TYPE, position: BABYLON.Vector2) {
        var box = this.createBaseBox();

        this.setLowBox(box, lowboxType, id);
        box.scaling.y = 1 / 3;
        box.position.y = this.PLANE_SIZE * 0.001 + this.BOX_SIZE / 6
        box.position.x = position.x;
        box.position.z = position.y;
        var o: ObjectData = new ObjectData();
        o.ID = id;
        o.Type = "LOWBOX_TYPE." + LOWBOX_TYPE[lowboxType].toString();
        o.Meshes = [box];
        this._objects[id] = o;
    }

    private setLowBox(box: BABYLON.Mesh, lowboxType: LOWBOX_TYPE, id: string) {
        var data: BoxData = new BoxData();
        box.isPickable = true;
        box.id = id;
        BABYLON.Tags.EnableFor(box);
        BABYLON.Tags.AddTagsTo(box, id);
        switch (lowboxType) {
            case LOWBOX_TYPE.Server:
                data.Image = "assets/logos/CustomServer.png";
                break;
            default:

                break;
        }
        var material0 = new BABYLON.StandardMaterial("mat0", this._scene);
        material0.diffuseColor = new BABYLON.Color3(1, 1, 1);
        material0.diffuseTexture = new BABYLON.Texture(data.Image, this._scene);
        (<BABYLON.Texture>material0.diffuseTexture).wAng = Math.PI;
        (<BABYLON.Texture>material0.diffuseTexture).getAlphaFromRGB = true;
        (<BABYLON.Texture>material0.diffuseTexture).hasAlpha = true;
        (<BABYLON.Texture>material0.diffuseTexture).uScale = 1;
        (<BABYLON.Texture>material0.diffuseTexture).vScale = 1;

        material0.bumpTexture = new BABYLON.Texture(data.Image, this._scene);
        (<BABYLON.Texture>material0.bumpTexture).wAng = Math.PI;
        (<BABYLON.Texture>material0.bumpTexture).uScale = 1;
        (<BABYLON.Texture>material0.bumpTexture).vScale = 1;

        var material1 = new BABYLON.StandardMaterial("mat1", this._scene);
        material1.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);

        var multimat = new BABYLON.MultiMaterial("multi", this._scene);
        multimat.subMaterials.push(material0);
        multimat.subMaterials.push(material1);

        box.rotate(new BABYLON.Vector3(0, 1, 0), Math.PI, BABYLON.Space.LOCAL);
        box.material = multimat;
        box.subMeshes = [];
        var verticesCount = box.getTotalVertices();
        box.subMeshes.push(new BABYLON.SubMesh(0, 0, verticesCount, 0, 6, box));
        box.subMeshes.push(new BABYLON.SubMesh(1, 0, verticesCount, 6, 30, box));
    }

    private createBox(id: string, boxType: BOX_TYPE, position: BABYLON.Vector2) {
        var box = this.createBaseBox();
        this.setBox(box, boxType, id);
        box.position.x = position.x;
        box.position.z = position.y;
        var o: ObjectData = new ObjectData();
        o.ID = id;
        o.Type = "BOX_TYPE." + BOX_TYPE[boxType].toString();
        o.Meshes = [box];
        this._objects[id] = o;
    }

    private setBox(box: BABYLON.Mesh, boxType: BOX_TYPE, id: string) {
        var data: BoxData = new BoxData();
        box.isPickable = true;
        box.id = id;
        BABYLON.Tags.EnableFor(box);
        BABYLON.Tags.AddTagsTo(box, id);
        switch (boxType) {
            case BOX_TYPE.VM:
                data.Image = "assets/logos/VM symbol only.png";
                break;
            case BOX_TYPE.WebSite:
                data.Image = "assets/logos/Azure Websites.png";
                break;
            case BOX_TYPE.O365:
                data.Image = "assets/logos/Office 365.png";
                break;
            case BOX_TYPE.GitRepo:
                data.Image = "assets/logos/Git repository.png";
                break;
            case BOX_TYPE.GitHub:
                data.Image = "assets/logos/GitHub.png";
                break;
            case BOX_TYPE.VSO:
                data.Image = "assets/logos/Visual Studio Online.png";
                break;
            case BOX_TYPE.MachineLearning:
                data.Image = "assets/logos/Machine Learning.png";
                break;
            case BOX_TYPE.HDInsight:
                data.Image = "assets/logos/HDInsight.png";
                break;
            case BOX_TYPE.StreamAnalytics:
                data.Image = "assets/logos/Stream Analytics.png";
                break;
            case BOX_TYPE.EventHubs:
                data.Image = "assets/logos/Event Hubs.png";
                break;
            default:

                break;
        }
        var material0 = new BABYLON.StandardMaterial("mat0", this._scene);
        material0.emissiveColor = new BABYLON.Color3(0, 0.5, 0);
        material0.diffuseColor = new BABYLON.Color3(0.5, 0.5,0.5);

        material0.emissiveTexture = new BABYLON.Texture(data.Image, this._scene);
        (<BABYLON.Texture>material0.emissiveTexture).wAng = Math.PI;
        (<BABYLON.Texture>material0.emissiveTexture).getAlphaFromRGB = true;
        (<BABYLON.Texture>material0.emissiveTexture).hasAlpha = true;
        (<BABYLON.Texture>material0.emissiveTexture).uScale = 1;
        (<BABYLON.Texture>material0.emissiveTexture).vScale = 1;
        material0.useAlphaFromDiffuseTexture = false;
      
        var material1 = new BABYLON.StandardMaterial("mat1", this._scene);
        material1.emissiveColor = new BABYLON.Color3(0, 0.5, 0);
        material1.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);

        var multimat = new BABYLON.MultiMaterial("multi", this._scene);
        multimat.subMaterials.push(material0);
        multimat.subMaterials.push(material1);

        box.rotate(new BABYLON.Vector3(0, 1, 0), Math.PI, BABYLON.Space.LOCAL);
        box.material = multimat;
        box.subMeshes = [];
        var verticesCount = box.getTotalVertices();
        box.subMeshes.push(new BABYLON.SubMesh(0, 0, verticesCount, 0, 6, box));
        box.subMeshes.push(new BABYLON.SubMesh(1, 0, verticesCount, 6, 30, box));

    }

    private drawArrow(id: string, arrowType: ARROW_TYPE, points: BABYLON.Vector2[], color: BABYLON.Color4) {
        var point1: BABYLON.Vector2 = points[0];
        var meshes: BABYLON.Mesh[] = [];
        for (var count: number = 1; count < points.length; count++) {
            var backgroundColor: BABYLON.Color3 = new BABYLON.Color3(color.r, color.g, color.b);
            var point2: BABYLON.Vector2 = points[count];
            var point3: BABYLON.Vector2 = point1.add(point2).multiplyByFloats(0.5, 0.5);
            var arrow = BABYLON.Mesh.CreateBox("arrow", this.BOX_SIZE, this._scene);
            arrow.scaling.x = point1.subtract(point2).length() / this.BOX_SIZE;
            arrow.scaling.z = 0.05;
            arrow.scaling.y = 0.001;
            var angle = -Math.atan2(point1.y - point2.y, point1.x - point2.x) + Math.PI / 2;
            arrow.position = new BABYLON.Vector3(point3.x, this.PLANE_SIZE * 0.001 + 0.11, point3.y);
            arrow.rotate(new BABYLON.Vector3(0, 1, 0), -Math.PI / 2 + angle, BABYLON.Space.LOCAL);

            arrow.material = new BABYLON.StandardMaterial("texture1", this._scene);
            (<BABYLON.StandardMaterial>arrow.material).diffuseColor = backgroundColor;
            (<BABYLON.StandardMaterial>arrow.material).specularColor = new BABYLON.Color3(0.7, 0.7, 0.7);
            (<BABYLON.StandardMaterial>arrow.material).emissiveColor = backgroundColor;
            (<BABYLON.StandardMaterial>arrow.material).alpha = color.a;
            arrow.isPickable = true;
            arrow.id = id;
            BABYLON.Tags.EnableFor(arrow);
            BABYLON.Tags.AddTagsTo(arrow, id);
            meshes.push(arrow);
            //Draw arrow tip?
            if (count == points.length - 1 && (arrowType == ARROW_TYPE.ArrowTip || arrowType == ARROW_TYPE.ArrowTipBothEnds)) {
                var tip = BABYLON.Mesh.CreateBox("arrow", this.BOX_SIZE, this._scene);
                tip.scaling.x = 0.2;
                tip.scaling.z = 0.2;
                tip.scaling.y = 0.001;
                angle = angle + Math.PI / 4;
                tip.position = new BABYLON.Vector3(point2.x, this.PLANE_SIZE * 0.001 + 0.11, point2.y);
                tip.rotate(new BABYLON.Vector3(0, 1, 0), -Math.PI / 2 + angle, BABYLON.Space.LOCAL);

                tip.material = new BABYLON.StandardMaterial("texture1", this._scene);
                (<BABYLON.StandardMaterial>tip.material).diffuseColor = backgroundColor;
                (<BABYLON.StandardMaterial>tip.material).specularColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                (<BABYLON.StandardMaterial>tip.material).emissiveColor = new BABYLON.Color3(color.r, color.g, color.b);
                (<BABYLON.StandardMaterial>tip.material).alpha = color.a;
                tip.isPickable = true;
                tip.id = id;
                BABYLON.Tags.EnableFor(tip);
                BABYLON.Tags.AddTagsTo(tip, id);
                meshes.push(tip);
            }

            //Draw arrow tip at both ends?
            if (count == points.length - 1 && arrowType == ARROW_TYPE.ArrowTipBothEnds) {
                tip = BABYLON.Mesh.CreateBox("arrow", this.BOX_SIZE, this._scene);
                tip.scaling.x = 0.2;
                tip.scaling.z = 0.2;
                tip.scaling.y = 0.001;
                tip.position = new BABYLON.Vector3(point1.x, this.PLANE_SIZE * 0.001 + 0.11, point1.y);
                tip.rotate(new BABYLON.Vector3(0, 1, 0), -Math.PI / 2 + angle, BABYLON.Space.LOCAL);

                tip.material = new BABYLON.StandardMaterial("texture1", this._scene);
                (<BABYLON.StandardMaterial>tip.material).diffuseColor = backgroundColor;
                (<BABYLON.StandardMaterial>tip.material).specularColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                (<BABYLON.StandardMaterial>tip.material).emissiveColor = new BABYLON.Color3(color.r, color.g, color.b);
                (<BABYLON.StandardMaterial>tip.material).alpha = color.a;
                tip.isPickable = true;
                tip.id = id;
                BABYLON.Tags.EnableFor(tip);
                BABYLON.Tags.AddTagsTo(tip, id);
                meshes.push(tip);
            }

            point1 = point2;
        }

        var o: ObjectData = new ObjectData();
        o.ID = id;
        o.Type = "ARROW_TYPE." + ARROW_TYPE[arrowType].toString();
        o.Meshes = meshes;
        this._objects[id] = o;
    }

    private drawBox2D(id: string, box2DType: BOX2D_TYPE, points: BABYLON.Vector2[], color: BABYLON.Color4) {
        switch (box2DType) {
            case BOX2D_TYPE.BorderOnly:

                var points2: BABYLON.Vector2[] = [];
                //Define flat box points
                points2.push(new BABYLON.Vector2(points[0].x, points[0].y));
                points2.push(new BABYLON.Vector2(points[1].x, points[0].y));
                points2.push(new BABYLON.Vector2(points[1].x, points[1].y));
                points2.push(new BABYLON.Vector2(points[0].x, points[1].y));
                points2.push(new BABYLON.Vector2(points[0].x, points[0].y));
                var point1: BABYLON.Vector2 = points2[0];
                var meshes: BABYLON.Mesh[] = [];
                for (var count: number = 1; count < points2.length; count++) {
                    var point2: BABYLON.Vector2 = points2[count];
                    var point3: BABYLON.Vector2 = point1.add(point2).multiplyByFloats(0.5, 0.5);
                    var line = BABYLON.Mesh.CreateBox("box2d", this.BOX_SIZE, this._scene);
                    line.scaling.x = point1.subtract(point2).length() / this.BOX_SIZE;
                    line.scaling.z = 0.05;
                    line.scaling.y = 0.001;
                    var angle = -Math.atan2(point1.y - point2.y, point1.x - point2.x) + Math.PI / 2;
                    line.position = new BABYLON.Vector3(point3.x, this.PLANE_SIZE * 0.001, point3.y);
                    line.rotate(new BABYLON.Vector3(0, 1, 0), -Math.PI / 2 + angle, BABYLON.Space.LOCAL);

                    line.material = new BABYLON.StandardMaterial("texture1", this._scene);
                    (<BABYLON.StandardMaterial>line.material).diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                    (<BABYLON.StandardMaterial>line.material).specularColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                    (<BABYLON.StandardMaterial>line.material).emissiveColor = new BABYLON.Color3(color.r, color.g, color.b);
                    (<BABYLON.StandardMaterial>line.material).alpha = color.a;
                    line.isPickable = true;
                    line.id = id;
                    BABYLON.Tags.EnableFor(line);
                    BABYLON.Tags.AddTagsTo(line, id);
                    meshes.push(line);
                    point1 = point2;
                }
                for (var count: number = 0; count < 4; count++) {
                    var corner = BABYLON.Mesh.CreateBox("box2d", this.BOX_SIZE, this._scene);
                    corner.scaling.x = 0.05;
                    corner.scaling.z = 0.05;
                    corner.scaling.y = 0.001;
                    corner.position = new BABYLON.Vector3(points2[count].x, this.PLANE_SIZE * 0.001, points2[count].y);
                    corner.material = new BABYLON.StandardMaterial("texture1", this._scene);
                    (<BABYLON.StandardMaterial>corner.material).diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                    (<BABYLON.StandardMaterial>corner.material).specularColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                    (<BABYLON.StandardMaterial>corner.material).emissiveColor = new BABYLON.Color3(color.r, color.g, color.b);
                    (<BABYLON.StandardMaterial>corner.material).alpha = color.a;
                    corner.isPickable = true;
                    corner.id = id;
                    BABYLON.Tags.EnableFor(corner);
                    BABYLON.Tags.AddTagsTo(corner, id);
                    meshes.push(corner);
                }

                var o: ObjectData = new ObjectData();
                o.ID = id;
                o.Type = "BOX2D_TYPE." + BOX2D_TYPE[box2DType].toString();
                o.Meshes = meshes;
                this._objects[id] = o;
                break;
            case BOX2D_TYPE.Filled:
                var backgroundColor: BABYLON.Color3 = new BABYLON.Color3(color.r, color.g, color.b);

                var point: BABYLON.Vector2 = points[0].add(points[1]).multiplyByFloats(0.5, 0.5);
                var box = BABYLON.Mesh.CreateBox("box2d", this.BOX_SIZE, this._scene);
                box.scaling.x = points[0].subtract(new BABYLON.Vector2(points[1].x, points[0].y)).length() / this.BOX_SIZE;
                box.scaling.z = points[0].subtract(new BABYLON.Vector2(points[0].x, points[1].y)).length() / this.BOX_SIZE;;
                box.scaling.y = 0.1;
                box.position = new BABYLON.Vector3(point.x, this.PLANE_SIZE * 0.001, point.y);
                box.material = new BABYLON.StandardMaterial("texture1", this._scene);
                (<BABYLON.StandardMaterial>box.material).diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
               // (<BABYLON.StandardMaterial>box.material).specularColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                (<BABYLON.StandardMaterial>box.material).emissiveColor = backgroundColor;
                (<BABYLON.StandardMaterial>box.material).alpha = color.a;
                box.isPickable = true;
                box.id = id;
                BABYLON.Tags.EnableFor(box);
                BABYLON.Tags.AddTagsTo(box, id);
                var o: ObjectData = new ObjectData();
                o.ID = id;
                o.Type = "BOX2D_TYPE." + BOX2D_TYPE[box2DType].toString();
                o.Meshes = [box];
                this._objects[id] = o;
                break;
            default:
                break;
        }
    }

    private drawImage(id: string, imageType: IMAGE_TYPE, image: string, position: BABYLON.Vector2, size: number, height: number) {
        switch (imageType) {
            case IMAGE_TYPE.Flat:

                var box = this.createBaseBox();
                box.isPickable = true;
                box.id = id;
                BABYLON.Tags.EnableFor(box);
                BABYLON.Tags.AddTagsTo(box, id);
                box.position.x = position.x;
                box.position.z = position.y;
                box.position.y = this.PLANE_SIZE * 0.001;

                var material0 = new BABYLON.StandardMaterial("mat0", this._scene);
                material0.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                material0.diffuseTexture = new BABYLON.Texture(image, this._scene);
                (<BABYLON.Texture>material0.diffuseTexture).wAng = Math.PI;
                (<BABYLON.Texture>material0.diffuseTexture).getAlphaFromRGB = true;
                (<BABYLON.Texture>material0.diffuseTexture).hasAlpha = true;
                (<BABYLON.Texture>material0.diffuseTexture).uScale = 1;
                (<BABYLON.Texture>material0.diffuseTexture).vScale = 1;


                material0.emissiveTexture = material0.diffuseTexture;
                material0.specularTexture = material0.diffuseTexture;
                material0.useAlphaFromDiffuseTexture = true;
                material0.useSpecularOverAlpha = true;

                var material1 = new BABYLON.StandardMaterial("mat1", this._scene);
                material1.alpha = 0;

                var multimat = new BABYLON.MultiMaterial("multi", this._scene);
                multimat.subMaterials.push(material0);
                multimat.subMaterials.push(material1);

                box.rotate(new BABYLON.Vector3(0, 1, 0), Math.PI, BABYLON.Space.LOCAL);
                box.rotate(new BABYLON.Vector3(1, 0, 0), -Math.PI / 2, BABYLON.Space.LOCAL);
                box.scaling.z = 0.0001;
                box.scaling.x = size / this.BOX_SIZE;
                box.scaling.y = size / this.BOX_SIZE;
                box.material = multimat;
                box.subMeshes = [];
                var verticesCount = box.getTotalVertices();
                box.subMeshes.push(new BABYLON.SubMesh(0, 0, verticesCount, 0, 6, box));
                box.subMeshes.push(new BABYLON.SubMesh(1, 0, verticesCount, 6, 30, box));
                var o: ObjectData = new ObjectData();
                o.ID = id;
                o.Type = "IMAGE_TYPE." + IMAGE_TYPE[imageType].toString();
                o.Meshes = [box];
                this._objects[id] = o;
                break;
            case IMAGE_TYPE.Floating:
                var box = this.createBaseBox();
                box.isPickable = true;
                box.id = id;
                BABYLON.Tags.EnableFor(box);
                BABYLON.Tags.AddTagsTo(box, id);
                box.position.x = position.x;
                box.position.z = position.y;


                var material0 = new BABYLON.StandardMaterial("mat0", this._scene);
                material0.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                material0.diffuseTexture = new BABYLON.Texture(image, this._scene);
                (<BABYLON.Texture>material0.diffuseTexture).wAng = Math.PI;
                (<BABYLON.Texture>material0.diffuseTexture).getAlphaFromRGB = true;
                (<BABYLON.Texture>material0.diffuseTexture).hasAlpha = true;
                (<BABYLON.Texture>material0.diffuseTexture).uScale = 1;
                (<BABYLON.Texture>material0.diffuseTexture).vScale = 1;


                material0.emissiveTexture = material0.diffuseTexture;
                material0.specularTexture = material0.diffuseTexture;
                material0.useAlphaFromDiffuseTexture = true;
                material0.useSpecularOverAlpha = true;

                var material1 = new BABYLON.StandardMaterial("mat1", this._scene);
                material1.alpha = 0;

                var multimat = new BABYLON.MultiMaterial("multi", this._scene);
                multimat.subMaterials.push(material0);
                multimat.subMaterials.push(material1);

                box.rotate(new BABYLON.Vector3(0, 1, 0), Math.PI, BABYLON.Space.LOCAL);

                box.scaling.z = 0.0001;
                box.scaling.x = size / this.BOX_SIZE;
                box.scaling.y = size / this.BOX_SIZE;
                box.position.y = this.PLANE_SIZE * 0.001 + box.scaling.y * this.BOX_SIZE / 2 + height;
                box.material = multimat;
                box.subMeshes = [];
                var verticesCount = box.getTotalVertices();
                box.subMeshes.push(new BABYLON.SubMesh(0, 0, verticesCount, 0, 6, box));
                box.subMeshes.push(new BABYLON.SubMesh(1, 0, verticesCount, 6, 30, box));

                box.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_Y;
                var o: ObjectData = new ObjectData();
                o.ID = id;
                o.Type = "IMAGE_TYPE." + IMAGE_TYPE[imageType].toString();
                o.Meshes = [box];
                this._objects[id] = o;
                break;
            default:
                break;
        }
    }

    private drawText(id: string, textType: TEXT_TYPE, position: BABYLON.Vector2, color: BABYLON.Color4, fontSize: number, text: string, fontName: string, height: number, rotate: number) {
        switch (textType) {
            case TEXT_TYPE.Flat:
                var box = BABYLON.Mesh.CreateBox("textbox2d", this.BOX_SIZE, this._scene);
                box.scaling.y = 0.00001;
                box.material = new BABYLON.StandardMaterial("texture1", this._scene);
                box.isPickable = true;
                box.id = id;
                BABYLON.Tags.EnableFor(box);
                BABYLON.Tags.AddTagsTo(box, id);
                var texture = new BABYLON.DynamicTexture("dynamic texture", 512, this._scene, true, BABYLON.Texture.CUBIC_MODE);

                texture.hasAlpha = true;
                texture.wAng = Math.PI / 2;
                var textureContext = texture.getContext();
                texture.canRescale = true;
                textureContext.font = "bold " + fontSize + "px " + fontName;
                var textSize = textureContext.measureText(text);
                var width = textSize.width / 80;
                if (width > box.scaling.x * this.BOX_SIZE)
                    box.scaling.x = width / this.BOX_SIZE;

                box.position = new BABYLON.Vector3(position.x + (this.BOX_SIZE * box.scaling.x) / 2, this.PLANE_SIZE * 0.001 + 0.4, position.y - (this.BOX_SIZE * box.scaling.z) / 2);

                var size = texture.getSize();
                textureContext.save();

                textureContext.fillStyle = "transparent";
                textureContext.fillRect(0, 0, size.width, size.height);

                textureContext.fillStyle = this.color3ToHex(new BABYLON.Color3(color.r, color.g, color.b));
                textureContext.globalAlpha = color.a;
                textureContext.textAlign = "left";
                textureContext.fillText(text, 0, 80, size.width);
                textureContext.restore();
                texture.update();

                (<BABYLON.StandardMaterial>box.material).diffuseTexture = texture;
                (<BABYLON.StandardMaterial>box.material).emissiveTexture = texture;
                (<BABYLON.StandardMaterial>box.material).specularTexture = texture;
                (<BABYLON.StandardMaterial>box.material).useAlphaFromDiffuseTexture = true;
                (<BABYLON.StandardMaterial>box.material).useSpecularOverAlpha = false;

                var o: ObjectData = new ObjectData();
                o.ID = id;
                o.Type = "TEXT_TYPE." + TEXT_TYPE[textType].toString();
                o.Meshes = [box];
                this._objects[id] = o;
                break;
            case TEXT_TYPE.Floating:
                var box = BABYLON.Mesh.CreateBox("textbox2d", this.BOX_SIZE, this._scene);
                box.scaling.z = 0.00001;
                box.material = new BABYLON.StandardMaterial("texture1", this._scene);
                box.isPickable = true;
                box.id = id;
                BABYLON.Tags.EnableFor(box);
                BABYLON.Tags.AddTagsTo(box, id);
                var texture = new BABYLON.DynamicTexture("dynamic texture", 512, this._scene, true);
                texture.hasAlpha = true;
                var textureContext = texture.getContext();
                textureContext.font = "bold " + fontSize + "px " + fontName;
                var size = texture.getSize();
                textureContext.save();
                textureContext.fillStyle = "transparent";
                textureContext.fillRect(0, 0, size.width, size.height);
                var textSize = textureContext.measureText(text);

                var width = textSize.width / 80;
                if (width > box.scaling.x * this.BOX_SIZE)
                    box.scaling.x = width / this.BOX_SIZE;
                box.position = new BABYLON.Vector3(position.x + (this.BOX_SIZE * box.scaling.x) / 2, this.PLANE_SIZE * 0.001 + box.scaling.z / 2 + height, position.y - (this.BOX_SIZE * box.scaling.z) / 2);

                textureContext.fillStyle = this.color3ToHex(new BABYLON.Color3(color.r, color.g, color.b));
                textureContext.globalAlpha = color.a;
                textureContext.textAlign = "left";
                textureContext.fillText(text, 0, 80, size.width);

                textureContext.restore();
                texture.update();

                (<BABYLON.StandardMaterial>box.material).diffuseTexture = texture;
                (<BABYLON.StandardMaterial>box.material).emissiveTexture = texture;
                (<BABYLON.StandardMaterial>box.material).specularTexture = texture;
                (<BABYLON.StandardMaterial>box.material).useAlphaFromDiffuseTexture = true;
                (<BABYLON.StandardMaterial>box.material).useSpecularOverAlpha = true;

                if (rotate == null)
                    box.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_Y;
                else
                    box.rotate(new BABYLON.Vector3(0, 1, 0), rotate * Math.PI / 180, BABYLON.Space.LOCAL);

                var o: ObjectData = new ObjectData();
                o.ID = id;
                o.Type = "TEXT_TYPE." + TEXT_TYPE[textType].toString();
                o.Meshes = [box];
                this._objects[id] = o;
                break;
            default:
                break;
        }
    }

    public handleObjectClick(pickingInfo: BABYLON.PickingInfo) {
        var mesh: BABYLON.AbstractMesh;
        mesh = pickingInfo.pickedMesh;

        var meshes: BABYLON.AbstractMesh[] = this._scene.getMeshesByTags(mesh.id);

        this._selectedMeshes = meshes;
        if (mesh != null) {

            this._definition.objects.forEach((item) => {
                if (item.id == mesh.id && (item.position2 != null || item.points2 != null)) {
                    this.navigateToMesh(item);
                }
            });
        }
    }
      
    public destroyScene() {
        if (this._scene != null) {

            if (this.VMUpdater != null) window.clearTimeout(this.VMUpdater);
            this.VMUpdater = null;

            this._engine.dispose();
            this._scene.dispose();
            this._scene = null;
            this._definition = null;
            this._engine = null;
            this._camera = null;
            this._cameraHidden = null;
            this._arcCamera = null;
            this._basePlane = null;
            this._light = null;
            this._lightPoints = [];
            this._objects = {};
            this.targetPosition = null;
            this.targetLookat = null;
            this.manualMode = false;
        }
    }

    public addItem(item: any) {
        var newItems = [];
        newItems.push(item);

        this._definition.objects.forEach((item) => {
                newItems.push(item);
        });
        this._definition.objects = newItems;
    }

    public addObject(objType: string) {
        var item:any = {};

        switch (objType.split(".")[0]) {
            case "CYLINDER_TYPE":
                item.id = "object" + (this._definition.objects.length + 1);
                item.type = objType;
                item.position2 = { "x": 0, "y": 0 };
                item.pinnedToMenu = false;
                item.menuName = item.id;
                item.description = null;

                this.addItem(item);
                this.createCylinder(item.id, CYLINDER_TYPE[<string>item.type.split(".")[1]], new BABYLON.Vector2(item.position2.x, item.position2.y));
                break;
            case "BOX_TYPE":
                item.id = "object" + (this._definition.objects.length + 1);
                item.type = objType;
                item.position2 = { "x": 0, "y": 0 };
                item.pinnedToMenu = false;
                item.menuName = item.id;
                item.description = null;
                this.addItem(item);
                this.createBox(item.id, BOX_TYPE[<string>item.type.split(".")[1]], new BABYLON.Vector2(item.position2.x, item.position2.y));
                break;
            case "LOWBOX_TYPE":
                item.id = "object" + (this._definition.objects.length + 1);
                item.type = objType;
                item.position2 = { "x": 0, "y": 0 };
                item.pinnedToMenu = false;
                item.menuName = item.id;
                item.description = null;
                this.addItem(item);
                this.createLowBox(item.id, LOWBOX_TYPE[<string>item.type.split(".")[1]], new BABYLON.Vector2(item.position2.x, item.position2.y));
                break;
            case "ARROW_TYPE":
                item.id = "object" + (this._definition.objects.length + 1);
                item.type = objType;
                item.points2 = [{ "x": 0, "y": 0 }, { "x": 20, "y": 0 }];
                item.color4 = [0.5, 0.5, 1, 1];
                this.addItem(item);
                var points: BABYLON.Vector2[] = [];
                item.points2.forEach((p) => {
                    points.push(new BABYLON.Vector2(p.x, p.y));
                });
                var color: BABYLON.Color4 = new BABYLON.Color4(item.color4[0], item.color4[1], item.color4[2], item.color4[3]);
                
                this.drawArrow(item.id, ARROW_TYPE[<string>item.type.split(".")[1]], points, color);
                break;
            case "BOX2D_TYPE":
                item.id = "object" + (this._definition.objects.length + 1);
                item.type = objType;
                item.points2 = [{ "x": 0, "y": 0 }, { "x": 20, "y": 0 }];
                item.color4 = [0, 0, 0.5, 1];
                item.pinnedToMenu = false;
                item.menuName = item.id;
                item.description = null;
                this.addItem(item);
                var points: BABYLON.Vector2[] = [];
                item.points2.forEach((p) => {
                    points.push(new BABYLON.Vector2(p.x, p.y));
                });
                var color: BABYLON.Color4 = new BABYLON.Color4(item.color4[0], item.color4[1], item.color4[2], item.color4[3]);
                this.drawBox2D(item.id, BOX2D_TYPE[<string>item.type.split(".")[1]], points, color);
                break;
            case "TEXT_TYPE":
                item.id = "object" + (this._definition.objects.length + 1);
                item.type = objType;
                item.position2 = { "x": 0, "y": 0 };
                item.color4 = [1, 1, 1, 1];
                item.fontSize = 60;
                item.fontName = "Segoe UI";
                item.text = "Sample text";
                this.addItem(item);
                var color: BABYLON.Color4 = new BABYLON.Color4(item.color4[0], item.color4[1], item.color4[2], item.color4[3]);
                var position: BABYLON.Vector2 = new BABYLON.Vector2(item.position2.x, item.position2.y);

                this.drawText(item.id, TEXT_TYPE[<string>item.type.split(".")[1]], position, color, item.fontSize, item.text, item.fontName, item.height, item.rotate);
                break;
            case "IMAGE_TYPE":
                item.id = "object" + (this._definition.objects.length + 1);
                item.type = objType;
                item.position2 = { "x": 0, "y": 0 };
                item.image = "assets/logos/Generic Files.png";
                item.size = 5;
                item.height = 2;
                item.pinnedToMenu = false;
                item.menuName = item.id;
                item.description = null;
                this.addItem(item);

                var position: BABYLON.Vector2 = new BABYLON.Vector2(item.position2.x, item.position2.y);
                this.drawImage(item.id, IMAGE_TYPE[<string>item.type.split(".")[1]], item.image, position, item.size, item.height);

                break;
            default:
                break;
        }

    }

    public createItem(item) {
        if (item.id.indexOf(' ') >= 0) {
            var error: string = "Object IDs can't contain spaces. Object: " + item.id;
            window.alert(error);
            throw error;
        }
        switch (item.type.split(".")[0]) {
            case "CYLINDER_TYPE":
                this.createCylinder(item.id, CYLINDER_TYPE[<string>item.type.split(".")[1]], new BABYLON.Vector2(item.position2.x, item.position2.y));
                break;
            case "BOX_TYPE":
                this.createBox(item.id, BOX_TYPE[<string>item.type.split(".")[1]], new BABYLON.Vector2(item.position2.x, item.position2.y));
                break;
            case "LOWBOX_TYPE":
                this.createLowBox(item.id, LOWBOX_TYPE[<string>item.type.split(".")[1]], new BABYLON.Vector2(item.position2.x, item.position2.y));
                break;
            case "ARROW_TYPE":
                var points: BABYLON.Vector2[] = [];
                item.points2.forEach((p) => {
                    points.push(new BABYLON.Vector2(p.x, p.y));
                });
                var color: BABYLON.Color4 = new BABYLON.Color4(item.color4[0], item.color4[1], item.color4[2], item.color4[3]);
                this.drawArrow(item.id, ARROW_TYPE[<string>item.type.split(".")[1]], points, color);
                break;
            case "BOX2D_TYPE":
                var points: BABYLON.Vector2[] = [];
                item.points2.forEach((p) => {
                    points.push(new BABYLON.Vector2(p.x, p.y));
                });
                if (points.length != 2)
                    throw "2D Boxes require 2 points";

                var color: BABYLON.Color4 = new BABYLON.Color4(item.color4[0], item.color4[1], item.color4[2], item.color4[3]);
                this.drawBox2D(item.id, BOX2D_TYPE[<string>item.type.split(".")[1]], points, color);
                break;
            case "TEXT_TYPE":
                var color: BABYLON.Color4 = new BABYLON.Color4(item.color4[0], item.color4[1], item.color4[2], item.color4[3]);
                var position: BABYLON.Vector2 = new BABYLON.Vector2(item.position2.x, item.position2.y);

                this.drawText(item.id, TEXT_TYPE[<string>item.type.split(".")[1]], position, color, item.fontSize, item.text, item.fontName, item.height, item.rotate);
                break;
            case "IMAGE_TYPE":

                var position: BABYLON.Vector2 = new BABYLON.Vector2(item.position2.x, item.position2.y);

                this.drawImage(item.id, IMAGE_TYPE[<string>item.type.split(".")[1]], item.image, position, item.size, item.height);
                break;
            default:
                break;
        }
    }

    public createScene(data, canvas: HTMLCanvasElement) {
        this._definition = data;
        this._engine = new BABYLON.Engine(canvas, true);
        this._canvas = canvas;

        this._scene = new BABYLON.Scene(this._engine);
        this._scene.clearColor = new BABYLON.Color3(0.21, 0.333, 0.6);

        this._camera = new BABYLON.TouchCamera("Camera", new BABYLON.Vector3(-100, 10, 0), this._scene);
        this._camera.attachControl(canvas, true);

        this._cameraHidden = new BABYLON.TouchCamera("Camera2", new BABYLON.Vector3(-100, 10, 0), this._scene);
        this._cameraHidden.attachControl(canvas, true);

        this._arcCamera = new BABYLON.ArcRotateCamera("Camera3", 4.7,0.5, 80, new BABYLON.Vector3(0, 0, 0), this._scene);
        this._arcCamera.attachControl(canvas, true);
        this.unFreezeArcCamera();
        this._scene.setActiveCameraByName("Camera");

        //Main light
        this._light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), this._scene);
        this._light.diffuse = new BABYLON.Color3(0.3, 0.3, 0.3);
        this._light.specular = new BABYLON.Color3(1, 1, 1);
        this._light.groundColor = new BABYLON.Color3(0, 0, 0);

        //Point lights
        var light0 = new BABYLON.PointLight("lpoint0", new BABYLON.Vector3(300, 40, 300), this._scene);
        light0.diffuse = new BABYLON.Color3(0.7, 0.7, 0.7);
        light0.specular = new BABYLON.Color3(0.9, 0.9, 0.9);
        this._lightPoints.push(light0);

        light0 = new BABYLON.PointLight("lpoint1", new BABYLON.Vector3(-500, 40, 300), this._scene);
        light0.diffuse = new BABYLON.Color3(0.7, 0.7, 0.7);
        light0.specular = new BABYLON.Color3(0.9, 0.9, 0.9);
        this._lightPoints.push(light0);


      

        this.createBasePlane();

        data.objects.forEach((item) => {
            this.createItem(item);
        });

        var slide1 = data.objects[0];
        var height: number = slide1.height == null ? 0 : slide1.height;
        this.targetPosition = new BABYLON.Vector3(slide1.position2.x, height + 35, slide1.position2.y - 50);
        this.targetLookat = new BABYLON.Vector3(slide1.position2.x, height, slide1.position2.y);
        this.manualMode = false;
      
        this._engine.runRenderLoop(() => {
            this._scene.render();
            if (!this.manualMode) {
                var camera = null;
                camera = this._camera;
                camera.position = camera.position.add(new BABYLON.Vector3((this.targetPosition.x - camera.position.x) / 50,
                    (this.targetPosition.y - camera.position.y) / 50,
                    (this.targetPosition.z - camera.position.z) / 50));
                this._cameraHidden.position = camera.position;
                this._cameraHidden.setTarget(this.targetLookat);
                var desiredRotation: BABYLON.Vector3 = this._cameraHidden.rotation;
                camera.rotation = camera.rotation.add(desiredRotation.subtract(camera.rotation).divide(new BABYLON.Vector3(50, 50, 50)));
            }
            if (!this._editing) {
            if (this.moving.back) {
                var speed = 0.1;
                    var transformationMatrix = this._camera.getWorldMatrix();
                var direction: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, -speed);
                var resultDirection: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0);
                BABYLON.Vector3.TransformNormalToRef(direction, transformationMatrix, resultDirection);
                    this._camera.cameraDirection.addInPlace(resultDirection);
                var camera2;
                    camera2 = this._camera;
                camera2._offsetX = 0.000001;
            } else if (this.moving.front) {
                var speed = 0.1;
                    var transformationMatrix = this._camera.getWorldMatrix();
                var direction: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, speed);
                var resultDirection: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0);
                BABYLON.Vector3.TransformNormalToRef(direction, transformationMatrix, resultDirection);
                    this._camera.cameraDirection.addInPlace(resultDirection);
                var camera2;
                    camera2 = this._camera;
                camera2._offsetX = 0.000001;
            }
            if (this.moving.left) {
                var speed = 0.1;
                    var transformationMatrix = this._camera.getWorldMatrix();
                var direction: BABYLON.Vector3 = new BABYLON.Vector3(-speed, 0, 0);
                var resultDirection: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0);
                BABYLON.Vector3.TransformNormalToRef(direction, transformationMatrix, resultDirection);
                    this._camera.cameraDirection.addInPlace(resultDirection);
                var camera2;
                    camera2 = this._camera;
                camera2._offsetX = 0.000001;
            } else if (this.moving.right) {
                var speed = 0.1;
                    var transformationMatrix = this._camera.getWorldMatrix();
                var direction: BABYLON.Vector3 = new BABYLON.Vector3(speed, 0, 0);
                var resultDirection: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0);
                BABYLON.Vector3.TransformNormalToRef(direction, transformationMatrix, resultDirection);
                    this._camera.cameraDirection.addInPlace(resultDirection);
                var camera2;
                    camera2 = this._camera;
                camera2._offsetX = 0.000001;
            }
            }
        });

        this.resize();
        this.VMUpdater = window.setInterval((evt) => {
            this.updateVM();
        }, 10000); 
        
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

// Copyright (c) Microsoft. See License.txt in the project root for license information.
/// <reference path="typings/babylon.2.2.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
interface IAppView {
    displayPopup: (item, editing: boolean, visualizer: IAppView) => void;
    click(evt): void;
    keyUp(evt): void;
    keyDown(evt): void;
    mouseDown(evt): void;
    pointerDown(evt): void;
    pointerMove(evt): void;
    pointerUp(evt): void;
    resize(evt): void;
    navigateToMesh(item): void;
    destroyScene(): void;
    createScene(data, canvas: HTMLCanvasElement): void;
    enterEditMode(): void;
    leaveEditMode(): any[];
    isEditing(): boolean;
    startMovingObject(): void;
    stopMovingObject(): void;
    deleteObject(): boolean;
    addObject(objType: string): void;
    showPropertyEditor(): void;
    saveProperties(): boolean;
}
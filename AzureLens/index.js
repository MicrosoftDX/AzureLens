///<reference path="scripts/babylon.max.js" />

var createScene = function () {
    // Get the canvas element from our HTML below
    var canvas = document.getElementById("renderCanvas");

    // Load the BABYLON 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    BABYLON.SceneLoader.Load("Assets/Spaceship/", "spaceship.babylon", engine, function (scene) {

        //attach Camera
        scene.activeCamera.attachControl(canvas);

        // Register a render loop to repeatedly render the scene
        engine.runRenderLoop(function () {
            scene.render();
        });

    }, null, null);

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });
}
/// <reference path="../types/three/index.d.ts" />

var APP = {
    constants: {
        range_long : {a: 115712, b: 120064},
        range_lat : {a: 231168, b: 235520},
        range_map : {a: 85, b: -85},
        // height_scaling: 10/18, // Real
        height_scaling: 1.3,
        tile_scaling: 10,
        max_trail_length: 600,
    }
}

APP.setup = async function () {
    this.tag = $("#tag");
    this.canvas = document.getElementById("webglcanvas");
    this.container = $("#container");
    this.canvas.width = this.container.width();
    this.canvas.height = this.container.height();
    this.canvas_bounds = this.canvas.getBoundingClientRect();

    // Create the Three.js renderer and attach it to our canvas
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.shadowMapEnabled = true;
    this.renderer.shadowMapType = THREE.PCFSoftShadowMap;

    // Set the viewport size
    this.renderer.setSize(this.canvas.width, this.canvas.height);

    // Create a new Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7EC0EE);

    // Create materials
    await APP.createMaterials();

    // Do points stuff
    await POINTS.setup();

    // Setup scene
    this.camera = new THREE.PerspectiveCamera(
        45,
        this.canvas.width / this.canvas.height,
        0.01,
        2000
    );
    this.controls = new THREE.OrbitControls(this.camera, this.canvas);
    this.controls.maxPolarAngle = Math.PI/2-0.02;
    this.controls.target.y = 3;
    this.camera.position.set(0, 10, 10);
    this.controls.update();
    this.scene.add(this.camera);

    // Create objects
    this.createObjects();

    console.log('Render');
    APP.lastUpdate = Date.now();
    window.requestAnimationFrame(this.tick);

    // Handle resize
    window.addEventListener('resize', () => {APP.adjust_viewport()});

    // Compass rose
    this.rose = $("#compass_rose");
}

APP.adjust_viewport = function(){
    console.log('Resize');
    this.canvas.width = this.container.width();
    this.canvas.height = this.container.height();
    this.canvas_bounds = this.canvas.getBoundingClientRect();
    this.camera.aspect = this.canvas.width / this.canvas.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( this.canvas.width, this.canvas.height );
}.bind(APP);

// Shows or hides the details panel
APP.show_panel = function(value){
    if(value){
        this.panel.panel.removeClass('hidden');
    }
    else{
        this.panel.panel.addClass('hidden');
    }
}.bind(APP);

// Main rendering frunction
APP.tick = function(){
    window.requestAnimationFrame(this.tick);
    var now = Date.now();
    var delta = now - this.lastUpdate;
    this.lastUpdate = now;
    // Render the scene
    this.renderer.render(this.scene, this.camera);
    // Update the camera controller
    this.controls.update();
    this.update(delta);
}.bind(APP);

APP.createMaterials = async function(){
    this.materials = {};
    this.materials['background'] = new THREE.MeshBasicMaterial({color: 0x032602, side: THREE.DoubleSide});
}

APP.createObjects = async function(){
    var backgroundPlane = new THREE.Mesh(new THREE.PlaneGeometry(500, 500, 1, 1), this.materials['background']);
    backgroundPlane.rotateX(deg2rad(-90));
    this.scene.add(backgroundPlane);

    var data = await loadJsonAsync('mapdata/map_meta.json');
    var elevation = await loadJsonAsync('mapdata/elevations.json');
    var x_offset = Math.floor(data.size_x/2);
    var y_offset = Math.floor(data.size_y/2);
    var loader = new THREE.TextureLoader();
    var scaling = APP.constants.tile_scaling;
    for (let index = 0; index < data.items.length; index++) {
        const item = data.items[index];
        var material = new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture('mapdata/images/' + item.name + '_texture.png'),
            color: 0x999999
        });
        var tile = makeTile(elevation[item.x + "_" + item.y], data.tile_size, material, scaling, APP.constants.height_scaling);
        this.scene.add(tile);
        var X = scaling*(item.x - x_offset);
        var Z = scaling*(item.y - y_offset);
        tile.position.set(X, 0, Z);
    }
    // Temp ambient light
    ambientLight = new THREE.AmbientLight ( 0xffffff);
    this.scene.add(ambientLight);
}

APP.update = function(delta){
    // Rotate compass rose
    var angle = this.controls.getAzimuthalAngle();
    this.rose.css('transform', 'rotate(' + angle + 'rad)');
}
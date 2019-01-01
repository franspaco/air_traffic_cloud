/// <reference path="../types/three/index.d.ts" />

let POINTS = {
    merc: new SphericalMercator({
        size: 256
    }),
    colors: {
        a: {
            hex: '#ffff00',
        },
        b: {
            hex: '#f00006',
        }
    },
    lims: {
        a: 5000,
        b: 45000
    },
    legends: [
        40, 30, 20, 10, 5
    ],
}

POINTS.init = function(){
    this.colors.a.val = h2r(this.colors.a.hex);
    this.colors.b.val = h2r(this.colors.b.hex);
    for (let index = 0; index < this.legends.length; index++) {
        const element = this.legends[index];
        console.log(element);
        var hex = r2h(this.getColor(element*1000));
        console.log(hex);
        $('#legend p').append('<div><div class="mini-box" style="background-color:' + hex + ';"> </div> ' + element + 'k ft</div>');
    }
}

POINTS.setup = async function(){
    this.init();
    
    var data = await $.getJSON('data/reduced.json', ()=>{});
    let positions = [];
    let colors = [];
    for (const item of data) {
        if(item.alt > 45000){
            continue;
        }
        let coords = this.transformCoordinates(item.lon, item.lat, item.alt);
        positions.push(coords.x);
        positions.push(coords.y);
        positions.push(coords.z);
        var color = this.getColor(item.alt);
        colors.push(color[0]);
        colors.push(color[1]);
        colors.push(color[2]);
    }
    console.log(positions.length);
    var geometry = new THREE.BufferGeometry();
    var vertices = new Float32Array(positions);
    var vertices_colors = new Uint8Array(colors);
    geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( vertices_colors, 3, true) );
    var material = new THREE.PointsMaterial({vertexColors: THREE.VertexColors, size: 0.2});
    this.cloud = new THREE.Points(geometry, material);
    this.cloud.frustumCulled = false;
    APP.scene.add(this.cloud);
}.bind(POINTS);


POINTS.getColor = function(alt){
    var res = mapDomain(alt, this.lims.a, this.lims.b, 1, 0);
    return interpolateColor(this.colors.a.val, this.colors.b.val, res);
}.bind(POINTS);

// Transform IRL coordinates into scene coordinates
POINTS.transformCoordinates = function(long, lat, alt){
    var xy = this.merc.px([long, lat], 11);
    return {
        x: mapDomain(xy[0], APP.constants.range_long.a, APP.constants.range_long.b, APP.constants.range_map.b, APP.constants.range_map.a), 
        z: mapDomain(xy[1], APP.constants.range_lat.a, APP.constants.range_lat.b, APP.constants.range_map.b, APP.constants.range_map.a),
        // Feet to Km by the scaling factor for the height
        y: alt * 0.0003048 * APP.constants.height_scaling
    };   
}
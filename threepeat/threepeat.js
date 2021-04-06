import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
// import Stats from './three/examples/jsm/libs/stats.module.js';

var w = window;
w.ll = 10;
w.fps = 60;
w.aspect = [1920, 1080];

//w.t = 0;

var scene, camera, renderer, stats;
var recording = false, size = [];

var resize = function(w, h) {
    if(w && h) {
        size = [ w, h ];
    }

    camera.aspect = size[0] / size[1];
    camera.updateProjectionMatrix();

    renderer.setSize(size[0], size[1]);
}

var windowResize = () => { resize(window.innerWidth, window.innerHeight) }

var record = function(name = ("output" + Date.now()), format = ".mp4", sz = 1, fps = 60) {
    recording = true;

    resize( w.aspect[0] * sz, w.aspect[1] * sz);
    window.addEventListener("resize", resize);

    var len = w.fps * w.ll;
    for (var i = 0; i < len; i++) {
        renderer.clear();

        let ms = (i/w.fps) * 1000
        update(i/(w.fps * w.ll), ms, tms + ms);
        renderer.render( scene, camera );

        var r = new XMLHttpRequest();
        var message = i == len - 1 ? 'end' : (name);
        r.open('POST', 'http://localhost:3999/' + message, false);
        var blob = dataURItoBlob(renderer.domElement.toDataURL());
        r.send(blob);
    }
}

var earlier = ( performance || Date ).now();
var ms = 0;
var tms = 0;

var animate = function() {
    if(!recording) {
        requestAnimationFrame( animate );

        let now = ( performance || Date ).now();
        ms += now - earlier;
        tms += now - earlier;
        earlier = now;

        if(ms > w.ll * 1000) ms = 0;

        w.t = ms / w.ll / 1000;
        update(w.t, ms);

        // stats.update();
        renderer.render( scene, camera );
    }
};

w.record = record;
w.r = w.record;

function dataURItoBlob(dataURI) {
    var mimetype = dataURI.split(",")[0].split(':')[1].split(';')[0];
    var byteString = atob(dataURI.split(',')[1]);
    var u8a = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        u8a[i] = byteString.charCodeAt(i);
    }
    return new Blob([u8a.buffer], { type: mimetype });
};

function threepeat(init, done) {
    w.init = init;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 ); //1000

    renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true, alpha: true});
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    document.body.appendChild( renderer.domElement );
    // renderer.setClearColor( 0x0000ff, 1);

    scene.background = null;

    // stats = new Stats();
    // document.body.appendChild( stats.dom );

    var orbit = new OrbitControls( camera, renderer.domElement );

    // orbit.get = function() {
    //     var t = {}
    //     return {
    //         target: (new THREE.Vector3()).copy(this.target),
    //         position: (new THREE.Vector3()).copy(this.object.position),
    //         zoom: this.object.zoom
    //     }
    // }
    //
    // orbit.set = function(get) {
    //     this.target0.copy(get.target);
    //     this.position0.copy(get.position);
    //     this.zoom0 = get.zoom;
    //
    //     this.reset();
    // }

    window.orbit = orbit;

    window.addEventListener("resize", windowResize);

    window.scene = scene;
    window.camera = camera;
    window.renderer = renderer;
    w.update = init(scene, camera, renderer);

    earlier = ( performance || Date ).now();
    animate();

    if(done) done();
}

export { threepeat, record }

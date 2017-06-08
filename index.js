// width and height of a window
const WIDTH = window.innerWidth,
      HEIGHT = window.innerHeight,
      UNITSIZE = 250; // size of a player and AI cubes

// global Three.js-related variables
var scene, camera, renderer;

onDocumentReady(function() {
    initGame();
})

function initGame() {
    // set up scene
    scene = new THREE.Scene();

    // field of view, aspect, near plane, far plane
    camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 1, 10000);
    scene.add(camera);

    // set up renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(WIDTH, HEIGHT);

    // add renderer to DOM
	renderer.domElement.style.backgroundColor = '#D6F1FF';
    document.body.appendChild(renderer.domElement);
}
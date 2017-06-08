// the game map
const map = [ // 1  2  3  4  5  6  7  8  9
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 0
           [1, 1, 0, 0, 0, 0, 0, 1, 1, 1,], // 1
           [1, 1, 0, 0, 2, 0, 0, 0, 0, 1,], // 2
           [1, 0, 0, 0, 0, 2, 0, 0, 0, 1,], // 3
           [1, 0, 0, 2, 0, 0, 2, 0, 0, 1,], // 4
           [1, 0, 0, 0, 2, 0, 0, 0, 1, 1,], // 5
           [1, 1, 1, 0, 0, 0, 0, 1, 1, 1,], // 6
           [1, 1, 1, 0, 0, 1, 0, 0, 1, 1,], // 7
           [1, 1, 1, 1, 1, 1, 0, 0, 1, 1,], // 8
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 9
           ];

// map width and height
const mapW = map.length,
      mapH = map[0].length;

// width and height of a window
const WIDTH = window.innerWidth,
      HEIGHT = window.innerHeight,
      UNITSIZE = 250; // size of a player, AI and wall cubes

// global Three.js-related variables
var scene, camera, renderer, controls, clock;

onDocumentReady(function() {
    initGame();
    animate();
})

function initGame() {
    // game clock
    clock = new THREE.Clock();

    // set up scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // field of view, aspect, near plane, far plane
    camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 10000);
    camera.position.y = UNITSIZE * 0.2;
    camera.position.x = 2 * UNITSIZE;
    camera.position.z = 2 * UNITSIZE;
    scene.add(camera);

    // intialize camera controls
    controls = new KeyboardControls(camera);

    // initialize world objects
    initWorld();

    // set up renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(WIDTH, HEIGHT);

    // add renderer to DOM
    document.body.appendChild(renderer.domElement);
}

function initWorld() {
    const textureLoader = new THREE.TextureLoader();

    // initialize floor
    var floorMaterial;
    textureLoader.load('textures/floor.png', function(t) {
        // figure out how to load a texture
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(mapW * UNITSIZE, 10, mapH * UNITSIZE),
            new THREE.MeshLambertMaterial({color: 0xEDCBA0})//map: t})
        )
        floor.position.x = (mapW * UNITSIZE / 2);
        floor.position.z = (mapH * UNITSIZE / 2);
        scene.add(floor);
    });

    // initialize walls
    const wallGeometry = new THREE.BoxGeometry(UNITSIZE, UNITSIZE, UNITSIZE);
    const wallMaterial = new THREE.MeshLambertMaterial({color: 0xFBEBCD});
    for(var i = 0; i < mapW; i++) {
        for(var j = 0; j < map[i].length; j++) {
            if(map[i][j]) {
                const wallBlock = new THREE.Mesh(wallGeometry, wallMaterial);
                wallBlock.position.x = i * UNITSIZE;
                wallBlock.position.y = UNITSIZE / 2;
                wallBlock.position.z = j * UNITSIZE;
                scene.add(wallBlock);
            }
        }
    }

    // initialize lighting
    const light1 = new THREE.DirectionalLight(0xffffff, 1.0);
	light1.position.set(0.5, 1, 0.5);
	scene.add(light1);
    const light2 = new THREE.DirectionalLight(0xffffff, 0.7);
	light2.position.set(-0.5, -1, -0.5);
	scene.add(light2);

    console.log('Initialized world');
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

// render the scene
function render() {
    const timeDelta = clock.getDelta();
    controls.update(timeDelta);
    renderer.render(scene, camera);
}
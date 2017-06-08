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
    camera.position.set(2 * UNITSIZE, UNITSIZE * 0.2, 2 * UNITSIZE);
    scene.add(camera);

    // intialize camera controls
    controls = new KeyboardControls(camera, checkCollision);

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
    var floorTexture = new THREE.ImageUtils.loadTexture( 'textures/floor.png' );
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set( 50, 50 );
    var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
    var floorGeometry = new THREE.PlaneGeometry(10000, 10000, 10, 10);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);

    // initialize walls
    const wallGeometry = new THREE.BoxGeometry(UNITSIZE, UNITSIZE, UNITSIZE);
    var texture = THREE.ImageUtils.loadTexture( 'textures/wall.png' );
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    const wallMaterial = new THREE.MeshLambertMaterial({map: texture});
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

function checkCollision(position) {
    const coords = getMapSector(position);
    return map[coords.x][coords.z] != 0;
}

function getMapSector(position) {
    var x = Math.ceil((position.x - UNITSIZE / 2) / UNITSIZE);
    var z = Math.ceil((position.z - UNITSIZE / 2) / UNITSIZE);
    if (x < 0) x = 0;
    if (x >= mapW - 1) x = mapW - 1;
    if (z < 0) z = 0;
    if (z >= mapH - 1) z = mapH - 1;
    return {x: x, z: z};
}
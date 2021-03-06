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
WIDTH = window.innerWidth,
      HEIGHT = window.innerHeight;
const UNITSIZE = 250, // size of a player, AI and wall cubes
      AINUM = 5,
      AI_RADIUS = 40;
      BULLET_SPEED = 1000.0,
      BULLET_RADIUS = 10;
      SHOOT_MIN_INTERVAL = 500, // minimum time interval between two shots, in milliseconds
      EXPLOSION_TIME = 100, // explosion time in milliseconds
      AISPEED = 5;

// global Three.js-related variables
var scene, camera, renderer, controls, clock, bullets = [], lastShot, explosions = [];

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
    setupAI();

    // set up renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(WIDTH, HEIGHT);

    lastShot = new Date().getTime();
    document.addEventListener('keydown', shoot);

    // add renderer to DOM
    document.body.appendChild(renderer.domElement);
}

function initWorld() {
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load('textures/floor.png', function(floorTexture) {
        // initialize floor
        floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set( 50, 50 );
        const floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
        const floorGeometry = new THREE.PlaneGeometry(10000, 10000, 10, 10);
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -0.5;
        floor.rotation.x = Math.PI / 2;
        scene.add(floor);
    });

    textureLoader.load('textures/wall.png', function(texture) {
        const wallGeometry = new THREE.BoxGeometry(UNITSIZE, UNITSIZE/2, UNITSIZE);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        const wallMaterial = new THREE.MeshLambertMaterial({map: texture});
        for (var i = 0; i < mapW; i++) {
            for (var j = 0; j < map[i].length; j++) {
                if (map[i][j]) {
                    const wallBlock = new THREE.Mesh(wallGeometry, wallMaterial);
                    wallBlock.position.x = i * UNITSIZE;
                    wallBlock.position.y = UNITSIZE / 4;
                    wallBlock.position.z = j * UNITSIZE;
                    scene.add(wallBlock);
                }
            }
        }
    });

    //initialize background
    var skyTexture = new THREE.ImageUtils.loadTexture( 'textures/sky.png' );
    skyTexture.wrapS = THREE.RepeatWrapping;
    skyTexture.repeat.set( 1, 1 );
    var backgroundMaterial = new THREE.MeshBasicMaterial( { map: skyTexture, side: THREE.DoubleSide } );
    var backgroundGeometry = new THREE.PlaneGeometry(20000, 20000, 10, 10);
    var background1 = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    background1.position.z = -3000;
    scene.add(background1);
    var background2 = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    background2.rotation.y = Math.PI / 2;
    background1.position.x = 2000;
    scene.add(background2);
    var background3 = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    background3.position.z = 4000;
    scene.add(background3);
    var background4 = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    background4.position.x = 5000;
    background4.rotation.y = 2.5 * Math.PI;
    scene.add(background4);



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

    // check bullet collisions with mobs
    for (var i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const intersects = bullet.raycaster.intersectObjects(ai);
        for(var j = 0; j <= intersects.length - 1; j++) {
            const intersect = intersects[j].object;
            if (bullet.position.distanceTo(intersect.position) <= AI_RADIUS + BULLET_RADIUS) {
                removeBullet(bullet, i);
                scene.remove(intersect);
                const aiIndex = ai.findIndex(a => a.uuid === intersect.uuid);
                ai.splice(aiIndex, 1);
                addAI();
            }
        }
    }

    // check bullet collisions with walls
    for (var i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const direction = new THREE.Vector3();
        direction.copy(bullet.raycaster.ray.direction);
        const distance = BULLET_SPEED * timeDelta;
        direction.multiplyScalar(distance);
        bullet.position.add(direction);
        if (checkCollision(bullet.position)) {
            removeBullet(bullet, i);
        }
    }

    const now = new Date().getTime();
    for (var i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        if (now - explosion.firedAt >= EXPLOSION_TIME) {
            // remove explosion if enough time has passed
            explosions.splice(i, 1);
            scene.remove(explosion.particles);
            explosion.clearParticles();
        } else {
            // otherwise continue explosion
            explosions[i].update();
        }
    }

    moveAI();

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

function spawnBullet() {
    const bullet = new THREE.Mesh(
        new THREE.SphereGeometry(BULLET_RADIUS),
        new THREE.MeshLambertMaterial({color: 0x473737})
    );
    bullet.position.set(camera.position.x, camera.position.y * 0.8, camera.position.z);

    const direction = new THREE.Vector3();
    direction.copy(controls.target);
    direction.y = 0;
    direction.normalize();

    // ray originating in bullet's initial position, with computed direction
    const raycaster = new THREE.Raycaster();
    raycaster.set(bullet.position, direction);
    bullet.raycaster = raycaster;

    // track all bullets on the scene
    bullets.push(bullet);

    scene.add(bullet);
}

var ai = [];
var aiGeo = new THREE.SphereGeometry(AI_RADIUS, 40, 40);
function setupAI() {
    for (var i = 0; i < AINUM; i++) {
        addAI();
    }
}

function addAI() {
    var c = getMapSector(camera.position);
    var aiMaterial = new THREE.MeshBasicMaterial({map: THREE.ImageUtils.loadTexture('textures/eye.png')});
    var o = new THREE.Mesh(aiGeo, aiMaterial);
    o.direction = new THREE.Vector3(AISPEED, 0, AISPEED);
    const rotation = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);
    o.direction.applyEuler(rotation);
    do {
        var x = getRandBetween(0, mapW-1);
        var z = getRandBetween(0, mapH-1);
    } while (map[x][z] > 0 || (x == c.x && z == c.z));
    x = Math.floor(x)  * UNITSIZE;
    z = Math.floor(z)  * UNITSIZE;
    o.position.set(x, UNITSIZE * 0.15, z);
    ai.push(o);
    scene.add(o);
}

function moveAI() {
    for (i = 0; i < ai.length - 1; i++) {
        const o = ai[i];
        o.position.add(o.direction);
        var delta = 1 + getRandBetween(0, 0.2);
        if(checkCollision(o.position))
        {
            o.direction.negate();
        }
    }
}

function getRandBetween(lo, hi) {
    return parseInt(Math.floor(Math.random()*(hi-lo+1))+lo, 10);
}

function shoot(e) {
    if (e.keyCode == 32) {
        const now = new Date().getTime();
        if (now - lastShot >= SHOOT_MIN_INTERVAL) {
            spawnBullet();
            lastShot = now;
        }
    }
}

function Explosion(position) {
    this.dirs = [];

    const totalObjects = 10000;
    const particleSpeed = 80;

    const geometry = new THREE.Geometry();

    for (i = 0; i < totalObjects; i ++) {
        const vertex = new THREE.Vector3();
        vertex.x = position.x;
        vertex.y = position.y;
        vertex.z = position.z;

        geometry.vertices.push(vertex);
        this.dirs.push({
            x: (Math.random() * particleSpeed) - (particleSpeed / 2),
            y: (Math.random() * particleSpeed) - (particleSpeed / 2),
            z: (Math.random() * particleSpeed) - (particleSpeed / 2)
        });
    }
    const material = new THREE.PointsMaterial({color: 0xEC9B00});
    this.particles = new THREE.Points(geometry, material);

    this.firedAt = new Date().getTime();

    this.update = function() {
        var pCount = totalObjects;
        while (pCount--) {
            const particle =  this.particles.geometry.vertices[pCount]
            particle.y += this.dirs[pCount].y;
            particle.x += this.dirs[pCount].x;
            particle.z += this.dirs[pCount].z;
        }
        this.particles.geometry.verticesNeedUpdate = true;
    }

    this.clearParticles = function() {
        this.particles.geometry.dispose();
    }
}

function removeBullet(bullet, i) {
    bullets.splice(i, 1);
    scene.remove(bullet);
    const explosion = new Explosion(bullet.position);
    explosions.push(explosion);
    scene.add(explosion.particles);
}
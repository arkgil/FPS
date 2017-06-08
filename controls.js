KeyboardControls = function(camera, checkCollision) {
    this.camera = camera;
    this.target = new THREE.Vector3(1, this.camera.position.y, 1);
    this.target.normalize()

    this.checkCollision = checkCollision;

    this.domElement = document;

    this.movementSpeed = 500.0;
    this.rotateSpeed= 0.005;

    this.moveForward = false;
    this.moveBackward = false;
    this.rotateLeft = false;
    this.rotateRight = false;

    this.onKeyDown = function (event) {
        switch(event.keyCode) {

            case 38: /*up*/
            case 87: /*W*/ this.moveForward = true; break;

            case 37: /*left*/
            case 65: /*A*/ this.rotateLeft = true; break;

            case 40: /*down*/
            case 83: /*S*/ this.moveBackward = true; break;

            case 39: /*right*/
            case 68: /*D*/ this.rotateRight = true; break;
        }

    };

    this.onKeyUp = function (event) {
        switch(event.keyCode) {
            case 38: /*up*/
            case 87: /*W*/ this.moveForward = false; break;

            case 37: /*left*/
            case 65: /*A*/ this.rotateLeft = false; break;

            case 40: /*down*/
            case 83: /*S*/ this.moveBackward = false; break;

            case 39: /*right*/
            case 68: /*D*/ this.rotateRight = false; break;
        }
    };

    this.update = function (timeDelta) {
        if (this.rotateLeft || this.rotateRight) {
            var phi = this.rotateSpeed * timeDelta * 1000;
            if (this.rotateLeft) phi = -phi;
            this.camera.rotation.y -= phi
        }

        // we start with the same vector as camera faces internally
        this.target = new THREE.Vector3(0, 0, -1);
        // then apply the same quaternion camera vector has applied
        this.target.applyQuaternion(camera.quaternion);
        // and normalize
        this.target.normalize();

        if (this.moveForward || this.moveBackward) {
            const direction = this.target.clone();
            const distance = timeDelta * this.movementSpeed;
            direction.multiplyScalar(timeDelta * this.movementSpeed);
            const newPosition = new THREE.Vector3();
            newPosition.copy(this.camera.position);
            if (this.moveForward) {
                newPosition.add(direction);
            }
            if (this.moveBackward) {
                newPosition.sub(direction);
            }
            console.log(newPosition);
            if(!this.checkCollision(newPosition)) this.camera.position.copy(newPosition);
        }
    }

    this.domElement.addEventListener('keydown', bind( this, this.onKeyDown ), false );
    this.domElement.addEventListener('keyup', bind( this, this.onKeyUp ), false );

    function bind(scope, fn) {
        return function () {
            fn.apply(scope, arguments);
        };
    };
}
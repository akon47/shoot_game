class NpcClass {
    constructor(id) {
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.width = 32;
        this.height = 32;
        this.right = this.x + this.width;
        this.bottom = this.y + this.height;
        this.destinationX = 0;
        this.destinationY = 0;
        this.speed = 0;
        this.type = 0;
        this.hp = 100.0;
        this.direction = 0;
        this.lastFrameProcessedTime = performance.now();
    }

    frame() {
        function getDistance(x1, y1, x2, y2) {
            const dX = (x2 - x1);
            const dY = (y2 - y1);
            return Math.sqrt(Math.abs(dX*dX) + Math.abs(dY*dY));
        }

        var now = performance.now();
        //const timeRatio = Math.min(((now - this.lastFrameProcessedTime) / 1000.0 * 60.0), 3);
        const timeRatio = ((now - this.lastFrameProcessedTime) / 1000.0 * 60.0);
        this.lastFrameProcessedTime = now;

        const speed = (this.speed * timeRatio);

        if(this.x !== this.destinationX || this.y !== this.destinationY) {
            const distance = getDistance(this.x, this.y, this.destinationX, this.destinationY);
            if(speed >= distance) {
                this.setPosition(this.destinationX, this.destinationY);
            } else {
                const ratio = speed / distance;
                this.offsetPosition(((this.destinationX - this.x) * ratio), ((this.destinationY - this.y) * ratio));
            }
        }
    }

    getId(){
        return this.id;
    }

    setHp(hp) {
        if(this.hp !== hp) {
            this.hp = hp;
            if(this.onhpchanged) {
                this.onhpchanged(this, hp);
            }
        }
    }

    getHp() {
        return this.hp;
    }

    setDestination(x, y) {
        if(x < 0) {
            x = 0;
        }
        if(y < 0) {
            y = 0;
        }
        if(this.destinationX !== x || this.destinationY !== y) {
            this.destinationX = x;
            this.destinationY = y;

            this.direction = Math.atan2(this.destinationY - this.y, this.destinationX - this.x) / Math.PI * 180;

            if(this.destinationchanged) {
                this.destinationchanged(this, this.destinationX, this.destinationY);
            }
        }
    }

    isMoving() {
        return (this.destinationX !== this.x || this.destinationY !== this.y);
    }
    
    getCurrentStatusFrame() {
        return undefined;
    }

    getDirection() {
        return this.direction;
    }

    getStatus() {
        return 'idle';
    }

    getDestinationX() {
        return this.destinationX;
    }

    getDestinationY() {
        return this.destinationY;
    }

    setType(type) {
        if(this.type !== type) {
            this.type = type;
        }
    }

    setSpeed(speed) {
        if(this.speed !== speed) {
            this.speed = speed;
        }
    }

    setPosition(x, y) {
        if(x < 0) {
            x = 0;
        }
        if(y < 0) {
            y = 0;
        }
        if(this.x !== x || this.y !== y) {
            this.x = x;
            this.y = y;
            this.right = this.x + this.width;
            this.bottom = this.y + this.height;
            if(this.positionchanged) {
                this.positionchanged(this, this.x, this.y);
            }
        }
    }

    getPositionX() {
        return this.x;
    }

    getPositionY() {
        return this.y;
    }

    getCenterX() {
        return (this.x + (this.width / 2));
    }

    getCenterY() {
        return (this.y + (this.height / 2));
    }

    getBottom() {
        return this.bottom;
    }

    getRight() {
        return this.right;
    }

    getWidth() {
        return this.width;
    }

    getHeight() {
        return this.height;
    }

    offsetPosition(x, y) {
        this.setPosition(this.x + x, this.y + y);
    }

    getPositionX() {
        return this.x;
    }

    getPositionY() {
        return this.y;
    }


}
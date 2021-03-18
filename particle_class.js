class ParticleClass {
    constructor() {
        this.particles = [];
        for(var i = 0; i < 500; i++) {
            this.particles.push(new ParticleObject());
        }
    }

    drawParticles(drawingContext, cameraClass) {

        for (var i = 0; i < this.particles.length; i++) {
            if (this.particles[i].active === true) {
                this.particles[i].draw(drawingContext, -cameraClass.getViewboxLeft(), -cameraClass.getViewboxTop());
            }
        }

    }

    setParticles(shootInfo) {
        var startAngle =  ((shootInfo.angle - 180 - 30) * Math.PI / 180);
        const angleRange = (60 * Math.PI / 180);

        // if(systemClass.pointerLockMode) {
        //     startAngle -= (systemClass.graphicsClass.cameraClass.getRotate() / 2);
        // }

        var count = 0;
        for (var i = 0; i < this.particles.length; i++) {
            if (this.particles[i].active === false) {
                const angle = (startAngle + (Math.random() * angleRange));

                this.particles[i].build(shootInfo.target.x, shootInfo.target.y, Math.cos(angle) * Math.random() * 10, Math.sin(angle) * Math.random() * 10);
                if(count++ > 50) {
                    break;
                }
            }
        }
    }
}

class ParticleObject {
    constructor() {
        this.active = false;
    }

    build(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.r = Math.random() * 2;
        if(!vx) {
            this.vx = Math.random() * 10 - 5;
        } else {
            this.vx = vx;
        }
        if(!vy) {
            this.vy = Math.random() * 10 - 5;
        } else {
            this.vy = vy;
        }
        this.gravity = .9;
        this.opacity = Math.random() + .5;
        this.active = true;
    }

    draw(dc, offsetX, offsetY) {
        dc.beginPath();
        dc.arc(this.x + offsetX, this.y + offsetY, this.r, 0, 2 * Math.PI, false);
        dc.fillStyle = "yellow";
        dc.fill();

        this.active = true;
        this.x += this.vx;
        this.y += this.vy;
        //this.vy += this.gravity;
        this.r = this.r - .1;
        //this.r = this.r - .001;

        if (this.r <= .05) {
            this.active = false;
        }
    }
}
class PlayerClass {
    constructor(id, isOtherPlayer) {
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.width = 32;
        this.height = 32;
        this.right = this.x + this.width;
        this.bottom = this.y + this.height;
        this.name = '';
        this.speedX = 0;
        this.speedY = 0;
        this.direction = 0.0;
        this.character = 0;
        this.weapon = 'handgun';
        this.hp = 100.0;
        this.kill = 0;
        this.death = 0;
        this.status = 'idle';
        this.isRunning = false;
        this.currentStatusFrame = undefined;
        this.otherPlayer = (isOtherPlayer === undefined ? false : isOtherPlayer);

        this.lastReceivedChat = undefined;
        this.lastReceivedChatTime = undefined;
        this.lastFrameProcessedTime = performance.now();

        this.ammo = [];
        this.ammo['handgun'] = { currentAmmo: 12, maxAmmo: 12 };
        this.ammo['rifle'] = { currentAmmo: 30, maxAmmo: 30 };
        this.ammo['shotgun'] = { currentAmmo: 6, maxAmmo: 6 };
    }

    resetAmmo() {
        this.ammo['handgun'].currentAmmo = this.ammo['handgun'].maxAmmo;
        this.ammo['rifle'].currentAmmo = this.ammo['rifle'].maxAmmo;
        this.ammo['shotgun'].currentAmmo = this.ammo['shotgun'].maxAmmo;
    }

    getCurrentAmmoInfo() {
        return this.ammo[this.weapon];
    }

    isOtherPlayer() {
        return this.otherPlayer;
    }

    isPlayerRunning() {
        return this.isRunning;
    }

    setRunning(running) {
        this.isRunning = running;
    }

    frame(hitBoxes) {
        function isCollision(rect1, rect2) {
            if (rect1 && rect2) {
                return (rect1.left < rect2.right && rect1.right > rect2.left && rect1.top < rect2.bottom && rect1.bottom > rect2.top);
            } else {
                return false;
            }
        }

        var now = performance.now();
        //const timeRatio = Math.min(((now - this.lastFrameProcessedTime) / 1000.0 * 60.0), 3);
        const timeRatio = ((now - this.lastFrameProcessedTime) / 1000.0 * 60.0);
        this.lastFrameProcessedTime = now;

        var offsetX = (this.speedX * timeRatio);
        var offsetY = (this.speedY * timeRatio);

        if (hitBoxes) {
            var playerHitBoxes = this.getHitBoxes();
            if (playerHitBoxes) {
                for (let j = 0; j < playerHitBoxes.length; j++) {
                    var playerHitBox = playerHitBoxes[j];
                    if (playerHitBox) {
                        for (let k = 0; k < hitBoxes.length; k++) {
                            var hitBox = hitBoxes[k];
                            if (hitBox) {
                                if (offsetX !== 0) {
                                    if (isCollision({ left: playerHitBox.x + offsetX, top: playerHitBox.y, right: playerHitBox.x + playerHitBox.width + offsetX, bottom: playerHitBox.y + playerHitBox.height }, hitBox)) {
                                        offsetX = offsetX > 0 ? (hitBox.left - playerHitBox.right) : (hitBox.right - playerHitBox.left);
                                    }
                                }
                                if (offsetY !== 0) {
                                    if (isCollision({ left: playerHitBox.x, top: playerHitBox.y + offsetY, right: playerHitBox.x + playerHitBox.width, bottom: playerHitBox.y + playerHitBox.height + offsetY }, hitBox)) {
                                        offsetY = offsetY > 0 ? (hitBox.top - playerHitBox.bottom) : (hitBox.bottom - playerHitBox.top);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        this.offsetPosition(offsetX, offsetY);
    }

    getShootInfo() {
        if (this.status === 'shoot') {
            return this.shootInfo;
        } else {
            return undefined;
        }
    }

    animateStatus(self, interval, remainFrames, backDelay, postFunction) {
        self.currentStatusFrame++;
        remainFrames--;
        if (remainFrames <= 0) {
            if (backDelay && backDelay > 0) {
                setTimeout(function (postFunction) { self.status = 'idle'; self.currentStatusFrame = undefined; if (postFunction) { postFunction(); } }, backDelay, postFunction);
            } else {
                if (postFunction) {
                    postFunction();
                }
                self.status = 'idle';
                self.currentStatusFrame = undefined;
            }
        } else if (self.status !== 'idle') {
            setTimeout(self.animateStatus, interval, self, interval, remainFrames, backDelay, postFunction);
        }
    }

    shoot(targetPoint, noDeviation) {
        if (this.weapon === 'flashlight' || this.weapon === 'knife') {
            this.meleeAttack();
        }
        else if (this.status === 'idle' && (this.otherPlayer || this.ammo[this.weapon].currentAmmo > 0)) {
            this.status = 'shoot';
            this.currentStatusFrame = 0;

            var backDelay = 0;
            var muzzlePoint = { x: this.getCenterX(), y: this.getCenterY() };

            var muzzleOffsetX = 0;
            var muzzleOffsetY = 0;
            var shootRange = 1000;
            var deviationAngle = 0;
            switch (this.weapon) {
                case 'handgun':
                    backDelay = 200;
                    muzzleOffsetX = 29;
                    muzzleOffsetY = 8;

                    deviationAngle = ((Math.PI / 180) * (1 - (Math.random() * 2)));
                    break;
                case 'rifle':
                    backDelay = 50;
                    muzzleOffsetX = 38;
                    muzzleOffsetY = 6.5;

                    deviationAngle = ((Math.PI / 180) * (2 - (Math.random() * 4)));
                    break;
                case 'shotgun':
                    backDelay = 700;
                    muzzleOffsetX = 38;
                    muzzleOffsetY = 6.5;
                    break;
            }

            if (this.speedX !== 0 || this.speedY !== 0) {
                deviationAngle *= 3;
            }

            const muzzleAngle = (Math.atan2(muzzleOffsetY, muzzleOffsetX) + (this.direction * Math.PI / 180));
            const muzzleDistance = Math.sqrt((muzzleOffsetX * muzzleOffsetX) + (muzzleOffsetY * muzzleOffsetY));
            muzzlePoint.x += (Math.cos(muzzleAngle) * muzzleDistance);
            muzzlePoint.y += (Math.sin(muzzleAngle) * muzzleDistance);

            var bulletAngle = 0.0;
            if (targetPoint !== undefined) {
                const bulletRadian = Math.atan2((targetPoint.y - muzzlePoint.y), (targetPoint.x - muzzlePoint.x)) + (noDeviation ? 0 : deviationAngle);
                bulletAngle = (bulletRadian * 180 / Math.PI);
                targetPoint.x = muzzlePoint.x + (Math.cos(bulletRadian) * shootRange);
                targetPoint.y = muzzlePoint.y + (Math.sin(bulletRadian) * shootRange);
            } else {
                targetPoint = { x: muzzleOffsetY + shootRange, y: muzzleOffsetY };
                const targetAngle = (Math.atan2(targetPoint.y, targetPoint.x) + (this.direction * Math.PI / 180)) + (noDeviation ? 0 : deviationAngle);
                const targetDistance = Math.sqrt((targetPoint.x * targetPoint.x) + (targetPoint.y * targetPoint.y));
                targetPoint.x = (Math.cos(targetAngle) * targetDistance) + this.getCenterX();
                targetPoint.y = (Math.sin(targetAngle) * targetDistance) + this.getCenterY();

                bulletAngle = (targetAngle * 180 / Math.PI);
            }
            setTimeout(this.animateStatus, 1000 / 60, this, 1000 / 60, 3, backDelay);

            this.shootInfo = {
                muzzle: muzzlePoint, target: targetPoint,
                angle: bulletAngle, hitObjectIntersection: undefined
            };

            if (this.ammo[this.weapon].currentAmmo > 0) {
                this.ammo[this.weapon].currentAmmo--;
            }

            if (this.onshoot) {
                this.onshoot(this, this.weapon, muzzlePoint, targetPoint, bulletAngle);
            }
        }
    }

    meleeAttack() {
        if (this.status === 'idle') {
            this.status = 'meleeattack';
            this.currentStatusFrame = 0;
            setTimeout(this.animateStatus, 1000 / 60, this, 1000 / 60, 15);

            if (this.onmeleeattack) {
                this.onmeleeattack(this, this.weapon);
            }
        }
    }

    reload() {
        if (this.weapon === 'handgun' || this.weapon === 'rifle' || this.weapon === 'shotgun') {
            if (this.status === 'idle' && (this.ammo[this.weapon].currentAmmo < this.ammo[this.weapon].maxAmmo)) {
                var totalFrames = 0;
                var interval = 1000 / 20;
                var backDelay = 0;
                switch (this.weapon) {
                    case 'handgun':
                        totalFrames = 15;
                        interval = 1000 / 20;
                        backDelay = 800;
                        break;
                    case 'rifle':
                        totalFrames = 20;
                        interval = 1000 / 20;
                        backDelay = 1000;
                        break;
                    case 'shotgun':
                        totalFrames = 20;
                        interval = 1000 / 40;
                        backDelay = 300;
                        break;
                }

                if (totalFrames > 0) {
                    this.status = 'reload';
                    this.currentStatusFrame = 0;

                    var self = this;
                    setTimeout(this.animateStatus, interval, this, interval, totalFrames, backDelay, function () {
                        self.ammo[self.weapon].currentAmmo = self.ammo[self.weapon].maxAmmo;
                    });
                    if (this.onreload) {
                        this.onreload(this, this.weapon);
                    }
                }
            }
        }
    }

    getStatus() {
        return this.status;
    }

    getCurrentStatusFrame() {
        return this.currentStatusFrame;
    }

    getHitBoxes() {
        const result =
            [
                { x: this.x, y: this.y, width: this.width, height: this.height, left: this.x, top: this.y, right: this.right, bottom: this.bottom }
            ];
        return result;
    }

    getSegments(cameraClass) {
        const hitBox = getHitBoxes()[0];
        const result =
            [
                { a: { x: hitBox.left, y: hitBox.top }, b: { x: hitBox.right, y: hitBox.top } },
                { a: { x: hitBox.right, y: hitBox.top }, b: { x: hitBox.right, y: hitBox.bottom } },
                { a: { x: hitBox.left, y: hitBox.bottom }, b: { x: hitBox.right, y: hitBox.bottom } },
                { a: { x: hitBox.left, y: hitBox.top }, b: { x: hitBox.left, y: hitBox.bottom } }
            ];
        if (cameraClass) {
            for (let i = 0; i < result.length; i++) {
                result[i].a.x -= cameraClass.getViewboxLeft();
                result[i].b.x -= cameraClass.getViewboxLeft();
                result[i].a.y -= cameraClass.getViewboxTop();
                result[i].b.y -= cameraClass.getViewboxTop();
            }
        }
        return result;
    }

    setDeath(death) {
        if (this.death !== death) {
            this.death = death;
            if (this.onkillchanged) {
                this.ondeathchanged(this, death);
            }
        }
    }

    getDeath() {
        return this.death;
    }

    setKill(kill) {
        if (this.kill !== kill) {
            this.kill = kill;
            if (this.onkillchanged) {
                this.onkillchanged(this, kill);
            }
        }
    }

    getKill() {
        return this.kill;
    }

    setHp(hp) {
        if (this.hp !== hp) {
            this.hp = hp;
            if (this.onhpchanged) {
                this.onhpchanged(this, hp);
            }
        }
    }

    getHp() {
        return this.hp;
    }

    setPosition(x, y) {
        if (x < 0) {
            x = 0;
        }
        if (y < 0) {
            y = 0;
        }
        if (this.x !== x || this.y !== y) {
            this.x = x;
            this.y = y;
            this.right = this.x + this.width;
            this.bottom = this.y + this.height;
            if (this.positionchanged) {
                this.positionchanged(this, this.x, this.y);
            }
        }
    }

    setWeapon(weapon) {
        if (this.status === 'idle') {
            if (this.weapon !== weapon) {
                this.weapon = weapon;
                if (this.weaponchanged) {
                    this.weaponchanged(this, weapon);
                }
            }
        }
    }

    getWeapon() {
        return this.weapon;
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

    getName() {
        return this.name;
    }

    setName(name) {
        if (this.name !== name) {
            this.name = name;
            if (this.namechanged) {
                this.namechanged(this, name);
            }
        }
    }

    getId() {
        return this.id;
    }

    getSpeedX() {
        return this.speedX;
    }

    setSpeedX(speed) {
        if (this.speedX !== speed) {
            this.speedX = speed;
            if (this.speedchanged) {
                this.speedchanged(this, this.speedX, this.speedY);
            }
        }
    }

    getSpeedY() {
        return this.speedY;
    }

    getBaseSpeed() {
        return this.isRunning ? 5 : 2;
    }

    setSpeed(speedX, speedY) {
        if (this.speedX !== speedX || this.speedY !== speedY) {
            this.speedX = speedX;
            this.speedY = speedY;
            if (this.speedchanged) {
                this.speedchanged(this, this.speedX, this.speedY);
            }
        }
    }

    setSpeedY(speed) {
        if (this.speedY !== speed) {
            this.speedY = speed;
            if (this.speedchanged) {
                this.speedchanged(this, this.speedX, this.speedY);
            }
        }
    }

    getDirection() {
        return this.direction;
    }

    setDirection(direction) {
        if (direction < -180) {
            direction += 360;
        } else if (direction > 180) {
            direction -= 360;
        }

        if (this.direction !== direction) {
            this.direction = direction;
            if (this.directionchanged) {
                this.directionchanged(this, direction);
            }
        }
    }

    getCharacter() {
        return this.character;
    }

    setCharacter(character) {
        if (this.character !== character) {
            this.character = character;
            if (this.characterchanged) {
                this.characterchanged(this, this.character);
            }
        }
    }

    setChat(chat) {
        this.lastReceivedChat = chat;
        this.lastReceivedChatTime = Date.now();
    }

    getLastReceivedChat() {
        return this.lastReceivedChat;
    }

    getLastReceivedChatTime() {
        return this.lastReceivedChatTime;
    }

    getPlayerDescription() {
        if (!(this.name) || (this.name.length === 0 || !(this.name.trim()))) {
            return this.id;
        }
        return this.name;
    }
}

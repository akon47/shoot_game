class SpriteClass {
    constructor(src, tileWidth, tileHeight) {
        this.tileHeight = tileHeight;
        this.tileWidth = tileWidth;
        this.spriteSrcPositions = [];
        this.isSpriteLoaded = false;
        this.image = new Image();
        this.image.src = src;

        var self = this;
        this.image.onload = function () {
            if (tileWidth && tileHeight) {
                for (var y = 0; y < self.image.height; y += tileHeight) {
                    for (var x = 0; x < self.image.width; x += tileWidth) {
                        self.spriteSrcPositions.push({ x: x, y: y });
                    }
                }

                if (!self.width) {
                    self.width = tileWidth;
                }
                if (!self.height) {
                    self.height = tileHeight;
                }
            } else {
                self.tileWidth = self.image.width;
                self.tileHeight = self.image.height;
                self.spriteSrcPositions.push({ x: 0, y: 0 });

                if (!self.width) {
                    self.width = self.image.width;
                }
                if (!self.height) {
                    self.height = self.image.height;
                }
            }
            self.isSpriteLoaded = true;
        }
    }

    getTileWidth() {
        return this.tileWidth;
    }

    getTileHeight() {
        return this.tileHeight;
    }

    getTotalFrames() {
        return this.spriteSrcPositions.length;
    }

    drawSprite(drawingContext, x, y, frameIndex, width, height) {
        if (this.isSpriteLoaded) {
            const srcSpritePosition = this.spriteSrcPositions[(frameIndex === undefined ? 0 : frameIndex)];
            if (srcSpritePosition) {
                drawingContext.drawImage(this.image,
                    srcSpritePosition.x, srcSpritePosition.y, this.tileWidth, this.tileHeight,
                    x, y, (width ? width : this.tileWidth), (height ? height : this.tileHeight));
            }
        }
    }
}

class CharacterSpriteClass {
    constructor(src, tileWidth, tileHeight, fps) {
        this.spriteClass = new SpriteClass(src, tileWidth, tileHeight);
        this.fps = (fps === undefined ? 1 : fps);
        this.frameInfos = [];
        this.frameValue = 0;
        this.lastDrawTime = performance.now();
    }

    addCharacterFrameInfo(stand, work) {
        this.frameInfos.push({ stand: stand, work: work });
    }

    drawCharacter(drawingContext, playerClass, cameraClass) {
        const now = performance.now();
        this.frameValue += ((now - this.lastDrawTime) / (1000 / this.fps));
        this.lastDrawTime = now;

        const frameCount = Math.floor(this.frameValue);
        if (playerClass) {
            const frameInfo = this.frameInfos[playerClass.getCharacter() % this.frameInfos.length];
            var frameIndex = 0;
            if (frameInfo) {
                switch (playerClass.getDirection()) {
                    case 'left':
                        if (playerClass.getSpeedX() < 0) {
                            frameIndex = frameInfo.work.left[(frameCount % frameInfo.work.left.length)];
                        } else {
                            frameIndex = frameInfo.stand.left[(frameCount % frameInfo.stand.left.length)];
                        }
                        break;
                    case 'up':
                        if (playerClass.getSpeedY() < 0) {
                            frameIndex = frameInfo.work.up[(frameCount % frameInfo.work.up.length)];
                        } else {
                            frameIndex = frameInfo.stand.up[(frameCount % frameInfo.stand.up.length)];
                        }
                        break;
                    case 'right':
                        if (playerClass.getSpeedX() > 0) {
                            frameIndex = frameInfo.work.right[(frameCount % frameInfo.work.right.length)];
                        } else {
                            frameIndex = frameInfo.stand.right[(frameCount % frameInfo.stand.right.length)];
                        }

                        break;
                    case 'down':
                        if (playerClass.getSpeedY() > 0) {
                            frameIndex = frameInfo.work.down[(frameCount % frameInfo.work.down.length)];
                        } else {
                            frameIndex = frameInfo.stand.down[(frameCount % frameInfo.stand.down.length)];
                        }
                        break;
                }
                const cameraZoom = cameraClass.getCameraZoom();
                const viewboxLeft = cameraClass.getViewboxLeft();
                const viewboxTop = cameraClass.getViewboxTop();
                const viewboxRight = cameraClass.getViewboxRight();
                const viewboxBottom = cameraClass.getViewboxBottom();

                const scaledUserX = (playerClass.getPositionX() * cameraZoom);
                const scaledUserY = (playerClass.getPositionY() * cameraZoom);
                const scaledUserWidth = (playerClass.getWidth() * cameraZoom);
                const scaledUserHeight = (playerClass.getHeight() * cameraZoom);

                if (viewboxLeft < scaledUserX + scaledUserWidth && viewboxRight > scaledUserX && viewboxTop < scaledUserY + scaledUserHeight && viewboxBottom > scaledUserY) {
                    this.spriteClass.drawSprite(drawingContext,
                        playerClass.getPositionX() + ((playerClass.getWidth() - this.spriteClass.getTileWidth()) / 2) - viewboxLeft,
                        playerClass.getCenterY() - this.spriteClass.getTileHeight() - viewboxTop,
                        frameIndex, this.spriteClass.getTileWidth(), this.spriteClass.getTileHeight());


                    drawingContext.beginPath();
                    drawingContext.lineWidth = 2;
                    drawingContext.strokeStyle = "black";
                    drawingContext.arc(playerClass.getCenterX() - viewboxLeft, playerClass.getCenterY() - viewboxTop, 100, Math.PI * 0.0, Math.PI * 2, false);
                    drawingContext.stroke();

                    const angle = 0.0;


                    drawingContext.beginPath();
                    drawingContext.lineWidth = 5;
                    drawingContext.strokeStyle = "orange";
                    drawingContext.arc(playerClass.getCenterX() - viewboxLeft, playerClass.getCenterY() - viewboxTop, 100, Math.PI * (angle - 0.05), Math.PI * (angle + 0.05), false);
                    drawingContext.stroke();
                }
            }
        }
    }
}

class SurvivorCharacterClass {
    constructor() {
        this.frameValue = 0;
        this.lastDrawTime = performance.now();

        this.weapon = 'flashlight'

        this.characters = ['flashlight', 'knife', 'handgun', 'rifle', 'shotgun'];
        this.characters['flashlight'] = ['idle', 'meleeattack', 'move'];
        this.characters['flashlight']['idle'] = { baseSrc: 'images/Survivor/flashlight/idle/survivor-idle_flashlight_{index}.png', totalFrames: 20, fps: 10, images: [], centerX: 94, centerY: 105 };
        this.characters['flashlight']['meleeattack'] = { baseSrc: 'images/Survivor/flashlight/meleeattack/survivor-meleeattack_flashlight_{index}.png', totalFrames: 15, fps: 10, images: [], centerX: 100, centerY: 129 };
        this.characters['flashlight']['move'] = { baseSrc: 'images/Survivor/flashlight/move/survivor-move_flashlight_{index}.png', totalFrames: 20, fps: 10, images: [], centerX: 94, centerY: 113 };

        this.characters['knife'] = ['idle', 'meleeattack', 'move'];
        this.characters['knife']['idle'] = { baseSrc: 'images/Survivor/knife/idle/survivor-idle_knife_{index}.png', totalFrames: 20, fps: 10, images: [], centerX: 107, centerY: 113 };
        this.characters['knife']['meleeattack'] = { baseSrc: 'images/Survivor/knife/meleeattack/survivor-meleeattack_knife_{index}.png', totalFrames: 15, fps: 10, images: [], centerX: 104, centerY: 113 };
        this.characters['knife']['move'] = { baseSrc: 'images/Survivor/knife/move/survivor-move_knife_{index}.png', totalFrames: 20, fps: 10, images: [], centerX: 107, centerY: 112 };

        this.characters['handgun'] = ['idle', 'meleeattack', 'move', 'reload', 'shoot'];
        this.characters['handgun']['idle'] = { baseSrc: 'images/Survivor/handgun/idle/survivor-idle_handgun_{index}.png', totalFrames: 20, fps: 10, images: [], centerX: 97, centerY: 120 };
        this.characters['handgun']['meleeattack'] = { baseSrc: 'images/Survivor/handgun/meleeattack/survivor-meleeattack_handgun_{index}.png', totalFrames: 15, fps: 10, images: [], centerX: 104, centerY: 124 };
        this.characters['handgun']['move'] = { baseSrc: 'images/Survivor/handgun/move/survivor-move_handgun_{index}.png', totalFrames: 20, fps: 10, images: [], centerX: 102, centerY: 119 };
        this.characters['handgun']['reload'] = { baseSrc: 'images/Survivor/handgun/reload/survivor-reload_handgun_{index}.png', totalFrames: 15, fps: 10, images: [], centerX: 101, centerY: 119 };
        this.characters['handgun']['shoot'] = { baseSrc: 'images/Survivor/handgun/shoot/survivor-shoot_handgun_{index}.png', totalFrames: 3, fps: 10, images: [], centerX: 99, centerY: 119 };

        this.characters['rifle'] = ['idle', 'meleeattack', 'move', 'reload', 'shoot'];
        this.characters['rifle']['idle'] = { baseSrc: 'images/Survivor/rifle/idle/survivor-idle_rifle_{index}.png', totalFrames: 20, fps: 10, images: [], centerX: 95, centerY: 120 };
        this.characters['rifle']['meleeattack'] = { baseSrc: 'images/Survivor/rifle/meleeattack/survivor-meleeattack_rifle_{index}.png', totalFrames: 15, fps: 10, images: [], centerX: 115, centerY: 201 };
        this.characters['rifle']['move'] = { baseSrc: 'images/Survivor/rifle/move/survivor-move_rifle_{index}.png', totalFrames: 20, fps: 10, images: [], centerX: 95, centerY: 119 };
        this.characters['rifle']['reload'] = { baseSrc: 'images/Survivor/rifle/reload/survivor-reload_rifle_{index}.png', totalFrames: 20, fps: 10, images: [], centerX: 101, centerY: 121 };
        this.characters['rifle']['shoot'] = { baseSrc: 'images/Survivor/rifle/shoot/survivor-shoot_rifle_{index}.png', totalFrames: 3, fps: 10, images: [], centerX: 94, centerY: 119 };

        this.characters['shotgun'] = ['idle', 'meleeattack', 'move', 'reload', 'shoot'];
        this.characters['shotgun']['idle'] = { baseSrc: 'images/Survivor/shotgun/idle/survivor-idle_shotgun_{index}.png', totalFrames: 20, fps: 10, images: [], centerX: 95, centerY: 120 };
        this.characters['shotgun']['meleeattack'] = { baseSrc: 'images/Survivor/shotgun/meleeattack/survivor-meleeattack_shotgun_{index}.png', totalFrames: 15, fps: 10, images: [], centerX: 115, centerY: 201 };
        this.characters['shotgun']['move'] = { baseSrc: 'images/Survivor/shotgun/move/survivor-move_shotgun_{index}.png', totalFrames: 20, fps: 10, images: [], centerX: 95, centerY: 119 };
        this.characters['shotgun']['reload'] = { baseSrc: 'images/Survivor/shotgun/reload/survivor-reload_shotgun_{index}.png', totalFrames: 20, fps: 10, images: [], centerX: 101, centerY: 121 };
        this.characters['shotgun']['shoot'] = { baseSrc: 'images/Survivor/shotgun/shoot/survivor-shoot_shotgun_{index}.png', totalFrames: 3, fps: 10, images: [], centerX: 94, centerY: 119 };

        this.loadedImages = 0;
        this.totalImages = 0;
        this.isCharacterLoaded = false;

        var self = this;
        for (var i = 0; i < this.characters.length; i++) {
            const weapon = this.characters[i];
            if (this.characters[weapon]) {
                for (var j = 0; j < this.characters[weapon].length; j++) {
                    const state = this.characters[weapon][j];
                    if (this.characters[weapon][state]) {
                        const frameInfo = this.characters[weapon][state];
                        this.totalImages += frameInfo.totalFrames;
                        for (var k = 0; k < frameInfo.totalFrames; k++) {
                            var image = new Image();
                            image.src = frameInfo.baseSrc.replace('{index}', k + '');
                            frameInfo.images.push(image)
                            image.onload = function () {
                                self.loadedImages++;
                                if (self.totalImages === self.loadedImages) {
                                    self.isCharacterLoaded = true;
                                }
                            };
                        }
                    }
                }
            }
        }
    }

    isLoaded() {
        return this.isCharacterLoaded;
    }

    drawCharacter(drawingContext, playerClass, cameraClass) {
        const now = performance.now();
        this.frameValue += ((now - this.lastDrawTime) / (1000 / 30));
        this.lastDrawTime = now;

        const frameCount = Math.floor(this.frameValue);
        if (playerClass) {

            var characterInfo = this.characters[playerClass.getWeapon()];
            if (!characterInfo) {
                characterInfo = this.characters['flashlight'];
            }

            var frameInfo = characterInfo['idle'];
            switch (playerClass.getStatus()) {
                case 'shoot':
                case 'meleeattack':
                case 'reload':
                    frameInfo = characterInfo[playerClass.getStatus()];
                    break;
                default:
                    if (playerClass.getSpeedX() !== 0 || playerClass.getSpeedY() !== 0) {
                        frameInfo = characterInfo['move'];
                    }
                    break;
            }

            if (frameInfo) {
                const viewboxLeft = cameraClass.getViewboxLeft();
                const viewboxTop = cameraClass.getViewboxTop();

                const userX = (playerClass.getPositionX());
                const userY = (playerClass.getPositionY());
                const userWidth = (playerClass.getWidth());
                const userHeight = (playerClass.getHeight());

                if (cameraClass.containsBox(userX, userY, userWidth, userHeight)) {

                    const currentStatusFrame = playerClass.getCurrentStatusFrame();
                    const img = frameInfo.images[(currentStatusFrame !== undefined ? currentStatusFrame : frameCount) % frameInfo.images.length];

                    var x = playerClass.getCenterX() - viewboxLeft;
                    var y = playerClass.getCenterY() - viewboxTop;

                    drawingContext.save();
                    drawingContext.translate(x, y);
                    drawingContext.rotate(playerClass.getDirection() * Math.PI / 180);

                    const scaleFactor = 0.2;
                    const dx = -(frameInfo.centerX * scaleFactor);
                    const dy = -(frameInfo.centerY * scaleFactor);
                    const dwidth = img.width * scaleFactor;
                    const dheight = img.height * scaleFactor;
                    drawingContext.drawImage(img, dx, dy, dwidth, dheight);

                    drawingContext.restore();

                    if (playerClass.getHp() < 100) {
                        drawingContext.fillStyle = "#454545";
                        drawingContext.beginPath();
                        drawingContext.rect(x - 15, y - (userHeight / 2) - 5 - 3 - 3, 30, 5);
                        drawingContext.fill();

                        drawingContext.fillStyle = playerClass.getHp() < 50 ? "red" : "lightgreen";
                        drawingContext.beginPath();
                        drawingContext.rect(x - 15, y - (userHeight / 2) - 5 - 3 - 3, 30 * (playerClass.getHp() / 100), 5);
                        drawingContext.fill();
                    }
                }
            }
        }
    }
}

class NpcCharacterClass {
    constructor() {
        this.frameValue = 0;
        this.lastDrawTime = performance.now();

        this.characters = ['skeleton'];
        this.characters['skeleton'] = ['idle', 'meleeattack', 'move'];
        this.characters['skeleton']['idle'] = { baseSrc: 'images/Monster/skeleton/idle/skeleton-idle_{index}.png', totalFrames: 17, fps: 10, images: [], centerX: 94, centerY: 105 };
        this.characters['skeleton']['meleeattack'] = { baseSrc: 'images/Monster/skeleton/meleeattack/skeleton-attack_{index}.png', totalFrames: 9, fps: 10, images: [], centerX: 84, centerY: 121 };
        this.characters['skeleton']['move'] = { baseSrc: 'images/Monster/skeleton/move/skeleton-move_{index}.png', totalFrames: 17, fps: 10, images: [], centerX: 99, centerY: 172 };

        this.loadedImages = 0;
        this.totalImages = 0;
        this.isCharacterLoaded = false;

        var self = this;
        for (var i = 0; i < this.characters.length; i++) {
            const weapon = this.characters[i];
            if (this.characters[weapon]) {
                for (var j = 0; j < this.characters[weapon].length; j++) {
                    const state = this.characters[weapon][j];
                    if (this.characters[weapon][state]) {
                        const frameInfo = this.characters[weapon][state];
                        this.totalImages += frameInfo.totalFrames;
                        for (var k = 0; k < frameInfo.totalFrames; k++) {
                            var image = new Image();
                            image.src = frameInfo.baseSrc.replace('{index}', k + '');
                            frameInfo.images.push(image)
                            image.onload = function () {
                                self.loadedImages++;
                                if (self.totalImages === self.loadedImages) {
                                    self.isCharacterLoaded = true;
                                }
                            };
                        }
                    }
                }
            }
        }
    }

    isLoaded() {
        return this.isCharacterLoaded;
    }

    drawCharacter(drawingContext, npcClass, cameraClass) {
        const now = performance.now();
        this.frameValue += ((now - this.lastDrawTime) / (1000 / 30));
        this.lastDrawTime = now;

        const frameCount = Math.floor(this.frameValue);

        if (npcClass) {

            var characterInfo = this.characters['skeleton'];

            var frameInfo = characterInfo['idle'];
            switch (npcClass.getStatus()) {
                case 'meleeattack':
                    frameInfo = characterInfo[npcClass.getStatus()];
                    break;
                default:
                    if (npcClass.isMoving()) {
                        frameInfo = characterInfo['move'];
                    }
                    break;
            }

            if (frameInfo) {
                const viewboxLeft = cameraClass.getViewboxLeft();
                const viewboxTop = cameraClass.getViewboxTop();

                const userX = (npcClass.getPositionX());
                const userY = (npcClass.getPositionY());
                const userWidth = (npcClass.getWidth());
                const userHeight = (npcClass.getHeight());

                if (cameraClass.containsBox(userX, userY, userWidth, userHeight)) {
                    var x = npcClass.getCenterX() - viewboxLeft;
                    var y = npcClass.getCenterY() - viewboxTop;

                    const currentStatusFrame = npcClass.getCurrentStatusFrame();
                    const img = frameInfo.images[(currentStatusFrame !== undefined ? currentStatusFrame : frameCount) % frameInfo.images.length];

                    drawingContext.save();
                    drawingContext.translate(x, y);
                    drawingContext.rotate(npcClass.getDirection() * Math.PI / 180);

                    const scaleFactor = 0.18;
                    const dx = -(frameInfo.centerX * scaleFactor);
                    const dy = -(frameInfo.centerY * scaleFactor);
                    const dwidth = img.width * scaleFactor;
                    const dheight = img.height * scaleFactor;
                    drawingContext.drawImage(img, dx, dy, dwidth, dheight);

                    drawingContext.restore();


                    if (npcClass.getHp() < 100) {
                        drawingContext.fillStyle = "#454545";
                        drawingContext.beginPath();
                        drawingContext.rect(x - 15, y - (userHeight / 2) - 5 - 3 - 3, 30, 5);
                        drawingContext.fill();

                        drawingContext.fillStyle = npcClass.getHp() < 50 ? "red" : "lightgreen";
                        drawingContext.beginPath();
                        drawingContext.rect(x - 15, y - (userHeight / 2) - 5 - 3 - 3, 30 * (npcClass.getHp() / 100), 5);
                        drawingContext.fill();
                    }

                    if (debugClass.debugGraphicsVisible) {
                        if (npcClass.getDestinationX() !== npcClass.getPositionX() || npcClass.getDestinationY() !== npcClass.getPositionY()) {
                            const destX = (npcClass.getDestinationX() - viewboxLeft) + (npcClass.getWidth() / 2);
                            const destY = (npcClass.getDestinationY() - viewboxTop) + (npcClass.getHeight() / 2);
                            drawingContext.strokeStyle = "magenta";
                            drawingContext.beginPath();
                            drawingContext.moveTo(x, y);
                            drawingContext.lineTo(destX, destY);
                            drawingContext.stroke();

                            drawingContext.fillStyle = "blue";
                            drawingContext.beginPath();
                            drawingContext.arc(destX, destY, 2, 0, 2 * Math.PI, false);
                            drawingContext.fill();
                        }
                    }
                }
            }
        }
    }
}
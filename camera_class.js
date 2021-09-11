class CameraClass {
    constructor(canvas) {
        this.cameraX = 0;
        this.cameraY = 0;
        this.screenWidth = canvas.width;
        this.screenHeight = canvas.height;
        this.limitX = undefined;
        this.limitY = undefined;
        this.cameraZoom = 1.0;
        this.rotate = 0.0;
        this.validation();
    }

    setLimit(x, y) {
        this.limitX = x;
        this.limitY = y;
    }

    validation() {
        this.viewboxWidth = (this.screenWidth / this.cameraZoom);
        this.viewboxHeight = (this.screenHeight / this.cameraZoom);

        if (this.cameraX < (this.viewboxWidth / 2)) {
            const x = (this.viewboxWidth / 2);
            this.viewboxLeft = (x - (this.viewboxWidth / 2));
            this.viewboxRight = (x + (this.viewboxWidth / 2));
            this.viewboxCenterX = x;
        } else if (this.limitX && this.cameraX > (this.limitX - (this.viewboxWidth / 2))) {
            const x = (this.limitX - (this.viewboxWidth / 2));
            this.viewboxLeft = (x - (this.viewboxWidth / 2));
            this.viewboxRight = (x + (this.viewboxWidth / 2));
            this.viewboxCenterX = x;
        } else {
            this.viewboxLeft = (this.cameraX - (this.viewboxWidth / 2));
            this.viewboxRight = (this.cameraX + (this.viewboxWidth / 2));
            this.viewboxCenterX = this.cameraX;
        }

        if (this.cameraY < (this.viewboxHeight / 2)) {
            const y = (this.viewboxHeight / 2);
            this.viewboxTop = (y - (this.viewboxHeight / 2));
            this.viewboxBottom = (y + (this.viewboxHeight / 2));
            this.viewboxCenterY = y;
        } else if (this.limitY && this.cameraY > (this.limitY - (this.viewboxHeight / 2))) {
            const y = (this.limitY - (this.viewboxHeight / 2));
            this.viewboxTop = (y - (this.viewboxHeight / 2));
            this.viewboxBottom = (y + (this.viewboxHeight / 2));
            this.viewboxCenterY = y;
        } else {
            this.viewboxTop = (this.cameraY - (this.viewboxHeight / 2));
            this.viewboxBottom = (this.cameraY + (this.viewboxHeight / 2));
            this.viewboxCenterY = this.cameraY;
        }

        this.circumscriptionRadius = (Math.sqrt((this.viewboxWidth * this.viewboxWidth) + (this.viewboxHeight * this.viewboxHeight)) / 2);
        this.circumscriptionRect = { left: this.viewboxCenterX - this.circumscriptionRadius, top: this.viewboxCenterY - this.circumscriptionRadius, right: this.viewboxCenterX + this.circumscriptionRadius, bottom: this.viewboxCenterY + this.circumscriptionRadius };
    }

    getRotate() {
        return this.rotate;
    }

    setRotate(rotate) {
        if (this.rotate !== rotate) {
            this.rotate = rotate;
        }
    }

    getCameraX() {
        return this.cameraX;
    }

    getCameraY() {
        return this.cameraY;
    }

    getViewboxWidth() {
        return this.viewboxWidth;
    }

    getViewboxHeight() {
        return this.viewboxHeight;
    }

    getViewboxLeft() {
        return this.viewboxLeft;
    }

    getViewboxTop() {
        return this.viewboxTop;
    }

    getViewboxRight() {
        return this.viewboxRight;
    }

    getViewboxBottom() {
        return this.viewboxBottom;
    }

    getViewboxCenterX() {
        return this.viewboxCenterX;
    }

    getViewboxCenterY() {
        return this.viewboxCenterY;
    }

    setCameraPosition(x, y) {
        this.cameraX = x;
        this.cameraY = y;
        this.validation();
    }

    moveCameraPosition(offsetX, offsetY) {
        this.cameraX += offsetX;
        this.cameraY += offsetY;
        this.validation();
    }

    setCameraZoom(zoom) {
        this.cameraZoom = zoom;
        this.validation();
    }

    containsPlayer(playerClass) {
        if (playerClass) {
            return true;
        }
        return false;
    }

    containsNpc(npcClass) {
        if (npcClass) {
            return true;
        }
        return false;
    }

    containsBox(x, y, width, height) {
        if (this.rotate === 0) {
            return (this.viewboxLeft < x + width && this.viewboxRight > x && this.viewboxTop < y + height && this.viewboxBottom > y);
        } else {
            return (this.circumscriptionRect.left < x + width && this.circumscriptionRect.right > x && this.circumscriptionRect.top < y + height && this.circumscriptionRect.bottom > y);
        }
    }
}
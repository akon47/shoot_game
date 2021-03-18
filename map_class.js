class MapClass {
    constructor(mapInfo) {
        this.width = mapInfo.width;
        this.height = mapInfo.height;
        this.tileWidth = mapInfo.tile_width;
        this.tileHeight = mapInfo.tile_height;
        this.tileMapSrc = mapInfo.tile_src;
        this.pixelWidth = (mapInfo.width * this.tileWidth);
        this.pixelHeight = (mapInfo.height * this.tileHeight);
        this.data = mapInfo.data;
        this.wall_tiles = mapInfo.wall_tiles;
        this.name = mapInfo.name;

        this.spriteClass = new SpriteClass(this.tileMapSrc, this.tileWidth, this.tileHeight);
        this.objects = [];
        this.hitBoxes = this.findHitBoxes(); // 성능에 크리티컬한 부분 아님. 오래걸려도 됨.
        this.segments = this.createSegments(this.hitBoxes); // 성능에 크리티컬한 부분 아님. 오래걸려도 됨.

        console.log("[MapClass] HitBoxes -> " + this.hitBoxes.length);
        console.log("[MapClass] Segments -> " + this.segments.length);
    }

    getPlaceableRandomPosition() {
        var self = this;
        function isWall(x, y) {
            for(var i = 0; i < self.wall_tiles.length; i++) {
                if(self.wall_tiles[i] === self.data[(y * self.width) + x]) {
                    return true;
                }
            }
            return false;
        }

        while(true) {
            const tileX = Math.floor(Math.random() * this.width) % this.width;
            const tileY = Math.floor(Math.random() * this.height) % this.height;
            if(!isWall(tileX, tileY)) {
                return { x: (tileX * this.tileWidth), y: (tileY * this.tileHeight)};
            }
        }
    }

    createSegments(hitBoxes) {
        function getSlope(segment) {
            const dx = (segment.b.x - segment.a.x);
            const dy = (segment.b.y - segment.a.y);
            if(dx === 0) {
                return undefined;
            } else {
                return (dy / dx);
            }
        }

        var segments = [];
        if(hitBoxes) {
            var tempSegments = [];
            for(var i = 0; i < hitBoxes.length; i++) {
                const hitBox = hitBoxes[i];
                if(hitBox) {
                    tempSegments.push(
                        { a: { x: hitBox.left, y: hitBox.top }, b: { x: hitBox.right, y: hitBox.top }, valid: true },
                        { a: { x: hitBox.right, y: hitBox.top }, b: { x: hitBox.right, y: hitBox.bottom }, valid: true },
                        { a: { x: hitBox.left, y: hitBox.bottom }, b: { x: hitBox.right, y: hitBox.bottom }, valid: true },
                        { a: { x: hitBox.left, y: hitBox.top }, b: { x: hitBox.left, y: hitBox.bottom }, valid: true }
                    );
                }
            }

            for(var i = 0; i < tempSegments.length; i++) {
                if(tempSegments[i].valid) {
                    const slopeSrc = getSlope(tempSegments[i]);
                    const interceptYSrc = (tempSegments[i].a.y - (tempSegments[i].a.x * slopeSrc));
                    const leftSrc = Math.min(tempSegments[i].a.x, tempSegments[i].b.x);
                    const topSrc = Math.min(tempSegments[i].a.y, tempSegments[i].b.y);
                    const rightSrc = Math.max(tempSegments[i].a.x, tempSegments[i].b.x);
                    const bottomSrc = Math.max(tempSegments[i].a.y, tempSegments[i].b.y);

                    for(var j = 0; j < tempSegments.length; j++) {
                        if(i !== j && tempSegments[j].valid) {
                            // tempSegments[i] 안에 tempSegments[j] 가 포함되는지 검사 후 valid 체크
                            const slopeDest = getSlope(tempSegments[j]);
                            if(slopeSrc === slopeDest) {
                                const interceptYDest = (tempSegments[j].a.y - (tempSegments[j].a.x * slopeSrc));
                                if(interceptYSrc === interceptYDest) {
                                    const leftDest = Math.min(tempSegments[j].a.x, tempSegments[j].b.x);
                                    const topDest = Math.min(tempSegments[j].a.y, tempSegments[j].b.y);
                                    const rightDest = Math.max(tempSegments[j].a.x, tempSegments[j].b.x);
                                    const bottomDest = Math.max(tempSegments[j].a.y, tempSegments[j].b.y);

                                    if(leftSrc <= leftDest && rightSrc >= leftDest &&
                                        leftSrc <= rightDest && rightSrc >= rightDest &&
                                        topSrc <= topDest && topSrc >= topDest &&
                                        bottomSrc <= bottomDest && bottomSrc >= bottomDest) {
                                        
                                        tempSegments[j].valid = false;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            for(var i = 0; i < tempSegments.length; i++) {
                if(tempSegments[i].valid) {
                    segments.push(tempSegments[i]);
                }
            }
        }
        return segments;
    }

    findHitBoxes() {
        var self = this;
        function isWall(x, y) {
            for(var i = 0; i < self.wall_tiles.length; i++) {
                if(self.wall_tiles[i] === self.data[(y * self.width) + x]) {
                    return true;
                }
            }
            return false;
        }
        
        function findLeftTopRight(findedHitbox) {
            function containsHitboxs(x, y){
                for(var i = 0; i < findedHitbox.length; i++) {
                    if(x >= findedHitbox[i].left && x <= findedHitbox[i].right && y >= findedHitbox[i].top && y <= findedHitbox[i].bottom) {
                        return true;
                    }
                }
                return false;
            }

            for(var y = 0; y < self.height; y++) {
                for(var x = 0; x < self.width; x++) {
                    if(!containsHitboxs(x, y) && isWall(x, y)) {
                        const left = x;
                        const top = y;
                        for(var r = (x + 1); r < self.width; r++) {
                            if(containsHitboxs(r, y) || !isWall(r, y)) {
                                return { left: x, top: y, right: (r - 1) };
                            }
                            
                            //////////////////////////////////// 최대 가로 32 블럭으로 제한
                            else {
                                if(((r - 1) - left) >= 32) {
                                    return { left: x, top: y, right: (r - 1) };
                                }
                            }
                            /////////////////////////////////////
                        }
                        return { left: x, top: y, right: (self.width - 1) };
                    }
                }
            }
            return undefined;
        }

        function findBottom(leftTopRight) {
            for(var y = (leftTopRight.top + 1); y < self.height; y++) {
                for(var x = leftTopRight.left; x <= leftTopRight.right; x++) {
                    if(!isWall(x, y)) {
                        return (y - 1);
                    }
                }

                //////////////////////////////////// 최대 세로 32 블럭으로 제한
                if(((y - 1) - leftTopRight.top) >= 32) {
                    return (y - 1);
                }
                /////////////////////////////////////
            }
            return (self.height - 1);
        }

        var findedHitbox = [];
        var result = [];
        while(true) {
            const leftTopRight = findLeftTopRight(findedHitbox);
            if(leftTopRight) {
                const bottom = findBottom(leftTopRight);
                findedHitbox.push({ left: leftTopRight.left, top: leftTopRight.top, right: leftTopRight.right, bottom: bottom });
                result.push(
                {
                    left: (leftTopRight.left * this.tileWidth),
                    top: (leftTopRight.top * this.tileHeight),
                    right: (leftTopRight.left * this.tileWidth) + (((leftTopRight.right - leftTopRight.left) * this.tileWidth) + this.tileWidth),
                    bottom: (leftTopRight.top * this.tileHeight) + (((bottom - leftTopRight.top) * this.tileHeight) + this.tileHeight)
                });
            } else {
                break;
            }
        }

        return result;
    }

    // constructor(width, height, tileMapSrc, tileWidth, tileHeight, data, name) {
    //     this.width = width;
    //     this.height = height;
    //     this.tileWidth = tileWidth;
    //     this.tileHeight = tileHeight;
    //     this.tileMapSrc = tileMapSrc;
    //     this.pixelWidth = (width * tileWidth);
    //     this.pixelHeight = (height * tileHeight);
    //     this.data = data;
    //     this.name = name;

    //     this.spriteClass = new SpriteClass(tileMapSrc, tileWidth, tileHeight);
    //     this.objects = [];
    // }

    isLoaded() {
        return this.spriteClass.isSpriteLoaded;
    }

    setMapName(name) {
        this.name = name;
    }

    getMapName(){
        return this.name;
    }

    getTileWidth(){
        return this.tileWidth;
    }

    getTileHeight() {
        return this.tileHeight;
    }

    getDescription() {
        if(this.name) {
            return this.name;
        } else {
            return ('[' + this.width + 'x' + this.height + '] MAP');
        }
    }

    getPixelWidth() {
        return (this.width * this.tileWidth);
    }

    getPixelHeight() {
        return (this.height * this.tileHeight);
    }

    drawTile(drawingContext, x, y, frameIndex, width, height) {
        if(drawingContext) {
            this.spriteClass.drawSprite(drawingContext, x, y, frameIndex, width, height);
        }
    }

    drawTile(drawingContext, tileX, tileY, x, y, width, height) {
        if(drawingContext && this.data) {
            var frameIndex = 0;
            frameIndex = this.data[(tileY * this.width) + tileX];
            if(frameIndex !== undefined) {
                if(frameIndex === 13) {
                    drawingContext.beginPath();
                    drawingContext.rect(x, y, width, height);
                    drawingContext.fillStyle = 'black';
                    drawingContext.fill();
                } else {
                    this.spriteClass.drawSprite(drawingContext, x, y, frameIndex, width, height);
                }
            }
        }
    }

    drawDebugTile(drawingContext, x, y, width, height, text) {
        if(drawingContext) {
            const margin = 1;

            drawingContext.beginPath();
            drawingContext.rect(x, y, width, height);
            drawingContext.fillStyle = 'black';
            drawingContext.fill();

            drawingContext.beginPath();
            drawingContext.rect(x + margin, y + margin, width - (margin * 2), height - (margin * 2));
            drawingContext.fillStyle = 'white';
            drawingContext.fill();

            drawingContext.font = "normal 8pt Arial";
            drawingContext.fillStyle = "black";
            drawingContext.textBaseline = 'middle';
            drawingContext.textAlign = 'center';
            drawingContext.fillText(text, x + (width / 2), y + (height / 2));
        }
    }

    drawLowQualityTile(drawingContext, tileX, tileY, x, y, width, height) {
        var self = this;
        function isWall(x, y) {
            for(var i = 0; i < self.wall_tiles.length; i++) {
                if(self.wall_tiles[i] === self.data[(y * self.width) + x]) {
                    return true;
                }
            }
            return false;
        }

        if(drawingContext && this.data) {
            drawingContext.beginPath();
            drawingContext.rect(x, y, width, height);
            drawingContext.fillStyle = isWall(tileX, tileY) ? 'black' : 'white';
            drawingContext.fill();
        }
    }

    drawMap(drawingContext, cameraClass, screenWidth, screenHeight) {
        if(drawingContext && cameraClass) {
            
            

            // drawingContext.beginPath();
            // drawingContext.arc(screenWidth / 2, screenHeight / 2, cameraClass.circumscriptionRadius, 0, Math.PI * 2, false);
            // drawingContext.fillStyle = 'white';
            // drawingContext.fill();
            // return;

            const drawOffsetX = ((cameraClass.getViewboxWidth() / 2) - cameraClass.getViewboxCenterX());
            const drawOffsetY = ((cameraClass.getViewboxHeight() / 2) - cameraClass.getViewboxCenterY());

            if(debugClass.debugLowQualityMap) {
                drawingContext.beginPath();
                drawingContext.arc(screenWidth / 2, screenHeight / 2, cameraClass.circumscriptionRadius, 0, Math.PI * 2, false);
                drawingContext.fillStyle = 'white';
                drawingContext.fill();

                drawingContext.fillStyle = 'black';
                for(var i = 0; i < this.hitBoxes.length; i++) {
                    const hitBox = this.hitBoxes[i];
                    if(hitBox) {
                        if(cameraClass.containsBox(hitBox.left, hitBox.top, hitBox.right - hitBox.left, hitBox.bottom - hitBox.top)) {
                            drawingContext.beginPath();
                            drawingContext.rect(hitBox.left - cameraClass.getViewboxLeft(), hitBox.top - cameraClass.getViewboxTop(), hitBox.right - hitBox.left, hitBox.bottom - hitBox.top);
                            drawingContext.fill();
                        }
                    }
                }
            } else {
                for(var y = 0; y < this.width; y++) {
                    for(var x = 0; x < this.height; x++) {
                        var tileX = (x * this.tileWidth);
                        var tileY = (y * this.tileHeight);

                        if(cameraClass.containsBox(tileX, tileY, this.tileWidth, this.tileHeight)) {
                            //this.drawDebugTile(drawingContext, scaledTileX + drawOffsetX, scaledTileY + drawOffsetY, scaledTileWidth, scaledTileHeight, x + ',' + y);
                            
                            if(debugClass.debugLowQualityMap) {
                                this.drawLowQualityTile(drawingContext, x, y, tileX + drawOffsetX, tileY + drawOffsetY, this.tileWidth, this.tileHeight);
                            } else {
                                this.drawTile(drawingContext, x, y, tileX + drawOffsetX, tileY + drawOffsetY, this.tileWidth, this.tileHeight);
                            }
                        }
                    }
                }
            }

            if(debugClass.debugGraphicsVisible) {
                drawingContext.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                drawingContext.lineWidth = 2;

                drawingContext.font = "normal 8pt Arial";
                drawingContext.fillStyle = "white";
                drawingContext.textBaseline = 'top';
                drawingContext.textAlign = 'left';

                for(var i = 0; i < this.hitBoxes.length; i++) {
                    drawingContext.beginPath();
                    drawingContext.rect(
                        this.hitBoxes[i].left - cameraClass.getViewboxLeft(),
                        this.hitBoxes[i].top - cameraClass.getViewboxTop(),
                        this.hitBoxes[i].right - this.hitBoxes[i].left,
                        this.hitBoxes[i].bottom - this.hitBoxes[i].top);
                    drawingContext.stroke();

                    
                    drawingContext.fillText('' + i, this.hitBoxes[i].left - cameraClass.getViewboxLeft() + 3, this.hitBoxes[i].top - cameraClass.getViewboxTop() + 3);
                }

                drawingContext.lineWidth = 1;
            }
        }
    }

    getSegments(cameraClass, range) {
        var segments = [];

        var rangeBox = undefined;
        if(range) {
            const x = cameraClass.getViewboxCenterX() - cameraClass.getViewboxLeft();
            const y = cameraClass.getViewboxCenterY() - cameraClass.getViewboxTop();
            rangeBox = 
            {
                left: x - range, top: y - range, right: x + range, bottom: y + range
            };
        }

        var hitBoxSegments = [];
        if(cameraClass) {
            for (var i = 0; i < this.segments.length; i++) {
                var segment =
                { 
                    a: { x: this.segments[i].a.x - cameraClass.getViewboxLeft(), y: this.segments[i].a.y - cameraClass.getViewboxTop() },
                    b: { x: this.segments[i].b.x - cameraClass.getViewboxLeft(), y: this.segments[i].b.y - cameraClass.getViewboxTop() }
                };
                hitBoxSegments.push(segment);
            }
        } else {
            hitBoxSegments = hitBoxSegments.concat(this.segments);
        }
        
        if (rangeBox) {
            for (var j = 0; j < hitBoxSegments.length; j++) {
                if ((rangeBox.left <= hitBoxSegments[j].a.x && rangeBox.right >= hitBoxSegments[j].a.x && rangeBox.top <= hitBoxSegments[j].a.y && rangeBox.bottom >= hitBoxSegments[j].a.y) ||
                    (rangeBox.left <= hitBoxSegments[j].b.x && rangeBox.right >= hitBoxSegments[j].b.x && rangeBox.top <= hitBoxSegments[j].b.y && rangeBox.bottom >= hitBoxSegments[j].b.y)) {
                    segments.push(hitBoxSegments[j]);
                }
            }
        }
        else {
            segments = segments.concat(hitBoxSegments);
        }

        return segments;
    }

    getHitBoxes() {
        return this.hitBoxes;
    }
}
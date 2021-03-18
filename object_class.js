class ObjectClass {
    constructor() {
        this.objects = [];

        // this.objects.push(new WallObjectClass(32 * 49, 32 * 44, 32 * 2, 32));
        // this.objects.push(new WallObjectClass(32 * 44, 32 * 49, 32, 32 * 2));
        // this.objects.push(new WallObjectClass(32 * 44, 32 * 44, 32, 32));
        // this.objects.push(new WallObjectClass(32 * 55, 32 * 44, 32, 32));
        // this.objects.push(new WallObjectClass(32 * 44, 32 * 55, 32, 32));
        // this.objects.push(new WallObjectClass(32 * 55, 32 * 55, 32, 32));
        // this.objects.push(new WallObjectClass(32 * 55, 32 * 49, 32, 32 * 2));
        // this.objects.push(new WallObjectClass(32 * 49, 32 * 55, 32 * 2, 32));

        // for(var i = 0; i < 22; i+=3) {
        //     this.objects.push(new WallObjectClass(32 * (39 + i), 32 * 40, 32, 32));
        //     this.objects.push(new WallObjectClass(32 * (39 + i), 32 * 59, 32, 32));
        // }
        // for(var i = 0; i < 17; i++) {
        //     this.objects.push(new WallObjectClass(32 * 36, 32 * (42 + i), 16, 16));
        //     this.objects.push(new WallObjectClass((32 * 63) + 16, 32 * (42 + i), 16, 16));
        // }
        
    }

    drawObjects(drawingContext, cameraClass, screenWidth, screenHeight) {
        const drawOffsetX = ((cameraClass.getViewboxWidth() / 2) - cameraClass.getViewboxCenterX());
        const drawOffsetY = ((cameraClass.getViewboxHeight() / 2) - cameraClass.getViewboxCenterY());

        for(var i = 0; i < this.objects.length; i++) {
            var obj = this.objects[i];
            if(obj) {
                if(cameraClass.containsBox(obj.x, obj.y, obj.width, obj.height)) {
                    drawingContext.beginPath();
                    drawingContext.fillStyle = 'blue';
                    drawingContext.rect(obj.x + drawOffsetX, obj.y + drawOffsetY, obj.width, obj.height);
                    drawingContext.fill();
                }
                // if(viewboxLeft < scaledObjX + scaledObjWidth && viewboxRight > scaledObjX && viewboxTop < scaledObjY + scaledObjHeight && viewboxBottom > scaledObjY) {
                    
                // }
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
        for(var i = 0; i < this.objects.length; i++) {
            var obj = this.objects[i];
            if(obj) {
                const objectSegments = obj.getSegments(cameraClass);
                if(rangeBox) {
                    for(var j = 0; j < objectSegments.length; j++) {
                        if((rangeBox.left <= objectSegments[j].a.x && rangeBox.right >= objectSegments[j].a.x && rangeBox.top <= objectSegments[j].a.y && rangeBox.bottom >= objectSegments[j].a.y) ||
                           (rangeBox.left <= objectSegments[j].b.x && rangeBox.right >= objectSegments[j].b.x && rangeBox.top <= objectSegments[j].b.y && rangeBox.bottom >= objectSegments[j].b.y)) {
                            segments.push(objectSegments[j]);
                        }
                    }
                }
                else {
                    segments = segments.concat(objectSegments);
                }
            }
        }
        return segments;
    }

    getHitBoxes() {
        var hitBoxes = [];
        for(var i = 0; i < this.objects.length; i++) {
            var obj = this.objects[i];
            if(obj) {
                hitBoxes = hitBoxes.concat(obj.getHitBoxes());
            }
        }
        return hitBoxes;
    }
}

class WallObjectClass {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.left = x;
        this.top = y;
        this.right = x + width;
        this.bottom = y + height;
    }

    getHitBoxes() {
        const result = 
        [
            { x: this.x, y: this.y, width: this.width, height: this.height, left: this.x, top: this.y, right: this.right, bottom: this.bottom }
        ];
        return result;
    }

    getSegments(cameraClass) {
        const result = 
        [
            { a: { x: this.left, y: this.top }, b: { x: this.right, y: this.top } },
            { a: { x: this.right, y: this.top }, b: { x: this.right, y: this.bottom } },
            { a: { x: this.left, y: this.bottom }, b: { x: this.right, y: this.bottom } },
            { a: { x: this.left, y: this.top }, b: { x: this.left, y: this.bottom } }
        ];
        if(cameraClass) {
            for(var i = 0; i < result.length; i++) {
                result[i].a.x -= cameraClass.getViewboxLeft();
                result[i].b.x -= cameraClass.getViewboxLeft();
                result[i].a.y -= cameraClass.getViewboxTop();
                result[i].b.y -= cameraClass.getViewboxTop();
            }
        }
        return result;
    }
}
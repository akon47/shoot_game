class ObjectClass {
    constructor() {
        this.objects = [];
    }

    drawObjects(drawingContext, cameraClass, screenWidth, screenHeight) {
        const drawOffsetX = ((cameraClass.getViewboxWidth() / 2) - cameraClass.getViewboxCenterX());
        const drawOffsetY = ((cameraClass.getViewboxHeight() / 2) - cameraClass.getViewboxCenterY());

        for (let i = 0; i < this.objects.length; i++) {
            var obj = this.objects[i];
            if (obj) {
                if (cameraClass.containsBox(obj.x, obj.y, obj.width, obj.height)) {
                    drawingContext.beginPath();
                    drawingContext.fillStyle = 'blue';
                    drawingContext.rect(obj.x + drawOffsetX, obj.y + drawOffsetY, obj.width, obj.height);
                    drawingContext.fill();
                }
            }
        }
    }

    getSegments(cameraClass, range) {
        var segments = [];

        var rangeBox = undefined;
        if (range) {
            const x = cameraClass.getViewboxCenterX() - cameraClass.getViewboxLeft();
            const y = cameraClass.getViewboxCenterY() - cameraClass.getViewboxTop();
            rangeBox =
            {
                left: x - range, top: y - range, right: x + range, bottom: y + range
            };
        }
        for (let i = 0; i < this.objects.length; i++) {
            var obj = this.objects[i];
            if (obj) {
                const objectSegments = obj.getSegments(cameraClass);
                if (rangeBox) {
                    for (let j = 0; j < objectSegments.length; j++) {
                        if ((rangeBox.left <= objectSegments[j].a.x && rangeBox.right >= objectSegments[j].a.x && rangeBox.top <= objectSegments[j].a.y && rangeBox.bottom >= objectSegments[j].a.y) ||
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
        for (let i = 0; i < this.objects.length; i++) {
            var obj = this.objects[i];
            if (obj) {
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
}
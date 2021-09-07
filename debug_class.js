class DebugClass {
    constructor() {
        this.frameCounter = new FrameCounter();

        this.debugInfoVisible = true;
        this.debugGraphicsVisible = false;
        this.debugLowQualityMap = true;
        this.black = false;
    }

    frame() {
        this.frameCounter.frame();
    }

    drawDebugInfo(drawingContext) {
        if (!this.debugInfoVisible) {
            return;
        }

        var debugTexts = [];

        //
        debugTexts.push('FPS: ' + this.frameCounter.getFps());
        debugTexts.push('Latency: ' + systemClass.networkClass.getLatency() + 'ms');
        //
        debugTexts.push('[F2]: Debug Graphics: ' + this.debugGraphicsVisible);
        //
        debugTexts.push('[F3]: Character Lock Mode: ' + systemClass.pointerLockMode);
        //
        debugTexts.push('[F4]: Muted: ' + systemClass.soundClass.muted);
        //
        debugTexts.push('[F6]: Low Quality Map: ' + this.debugLowQualityMap);
        //
        debugTexts.push('[F9]: imageSmoothingEnabled: ' + systemClass.graphicsClass.drawingContext.imageSmoothingEnabled);


        const fontHeightPixel = 12;
        drawingContext.font = "normal " + fontHeightPixel + "px Arial";
        drawingContext.textBaseline = 'top';
        drawingContext.textAlign = 'left';
        drawingContext.fillStyle = "white";
        for (var i = 0; i < debugTexts.length; i++) {
            drawingContext.fillText(debugTexts[i], 3, 3 + (12 * i));
        }
    }
}

class FrameCounter {
    constructor() {
        this.fps = 0;
        this.count = 0;
        this.startTimestamp = performance.now();
    }

    getFps() {
        return this.fps;
    }

    frame() {
        this.count++;

        var now = performance.now();
        if ((now - this.startTimestamp) >= 1000) {
            this.fps = this.count;
            this.count = 0;
            this.startTimestamp = now;
        }
    }
};

let debugClass = new DebugClass();
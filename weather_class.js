class WeatherClass {
    constructor(screenWidth, screenHeight) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;

        this.weather = new SnowWeatherClass(screenWidth, screenHeight, 60);
    }

    drawWeather(drawingContext) {
        if (this.weather) {
            this.weather.drawWeather(drawingContext);
        }
    }
}

class SnowWeatherClass {
    constructor(screenWidth, screenHeight, fps) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;

        function Flake() {
            this.draw = function (drawingContext) {
                this.g = drawingContext.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.sz);
                this.g.addColorStop(0, 'hsla(255,255%,255%,1)');
                this.g.addColorStop(1, 'hsla(255,255%,255%,0)');
                drawingContext.moveTo(this.x, this.y);
                drawingContext.fillStyle = this.g;
                drawingContext.beginPath();
                drawingContext.arc(this.x, this.y, this.sz, 0, Math.PI * 2, true);
                drawingContext.fill();
            }
        }

        this.snowArray = [];
        var num = 100, sp = 1;
        var sc = 1.3, min = 1;

        for (var i = 0; i < num; i++) {
            var snow = new Flake();
            snow.y = Math.random() * (this.screenHeight + 50);
            snow.x = Math.random() * this.screenWidth;
            snow.t = Math.random() * (Math.PI * 2);
            snow.sz = (100 / (10 + (Math.random() * 100))) * sc;
            snow.sp = (Math.pow(snow.sz * .8, 2) * .15) * sp;
            snow.sp = snow.sp < min ? min : snow.sp;
            this.snowArray.push(snow);
        }
        this.fps = fps;
        this.lastDrawTime = performance.now();
    }

    drawWeather(drawingContext) {
        var requireNextFrame = false;
        const now = performance.now();
        if (((now - this.lastDrawTime) > (1000 / this.fps))) {
            requireNextFrame = ((now - this.lastDrawTime) > (1000 / this.fps));
            this.lastDrawTime = now;
        }

        const tsc = 1;
        const mv = 20;

        for (var i = 0; i < this.snowArray.length; ++i) {
            var f = this.snowArray[i];
            if (requireNextFrame) {
                f.t += .05;
                f.t = f.t >= Math.PI * 2 ? 0 : f.t;
                f.y += f.sp;
                f.x += Math.sin(f.t * tsc) * (f.sz * .3);
                if (f.y > this.screenHeight + 50) {
                    f.y = -10 - Math.random() * mv;
                }
                if (f.x > this.screenWidth + mv) {
                    f.x = - mv;
                }
                if (f.x < - mv) {
                    f.x = this.screenWidth + mv;
                }
            }
            f.draw(drawingContext);
        }



    }

}
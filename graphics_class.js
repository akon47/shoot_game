class GraphicsClass {
    constructor(canvas, uiCanvas, objectClass) {
        this.canvas = canvas;
        this.uiCanvas = uiCanvas;
        this.drawingContext = canvas.getContext('2d');
        this.screenWidth = canvas.width;
        this.screenHeight = canvas.height;

        this.sightEffectClass = new SightEffectClass(canvas.width, canvas.height);
        this.uiClass = new UserInterfaceClass(uiCanvas);

        this.cameraClass = new CameraClass(canvas);
        this.mapClass = new MapClass(map_office_data);
        this.objectClass = objectClass;
        this.cameraClass.setLimit(this.mapClass.getPixelWidth(), this.mapClass.getPixelHeight());

        this.particleClass = new ParticleClass();

        this.weatherClass = new WeatherClass(canvas.width, canvas.height);

        this.survivorCharacterClass = new SurvivorCharacterClass();
        this.npcCharacterClass = new NpcCharacterClass();
    }

    setCameraPosition(x, y) {
        this.cameraClass.setCameraPosition(x, y);
    }

    shakeScreen(threshold, doFramesCount) {
        this.remainShakeFrames = (doFramesCount ? doFramesCount : 5);
        this.shakeThreshold = (threshold ? threshold : 5);
    }

    frame(players, npcs) {
        this.beginScene(this.drawingContext, 0, 0, 0, 1);
        if(debugClass.black) {
            return;
        }
        if(systemClass.pointerLockMode) {
            this.cameraClass.setRotate(-(systemClass.getCurrentPlayerClass().getDirection() + 90) * (Math.PI / 180));
        } else {
            this.cameraClass.setRotate(0.0);
        }

        if(!this.mapClass.isLoaded() || !this.survivorCharacterClass.isLoaded() || !this.uiClass.isLoaded() || !systemClass.soundClass.isLoaded()) {

            this.drawingContext.font = "bold 60px Arial";
            this.drawingContext.textBaseline = 'middle';
            this.drawingContext.textAlign = 'center';

            this.drawingContext.fillStyle = "white";
            this.drawingContext.fillText("LOADING", this.screenWidth / 2, this.screenHeight / 2);

            // this.drawingContext.font = "bold 20px Arial";
            // this.drawingContext.fillText(this.mapClass.isLoaded() + "," + this.survivorCharacterClass.isLoaded() + ',' + this.uiClass.isLoaded() + ',' + systemClass.soundClass.isLoaded(), this.screenWidth / 2, this.screenHeight / 2 + 100);
            return;
        } else {
            systemClass.chatClass.setVisible(true);
        }

        
        this.drawingContext.save();
        if(this.cameraClass.getRotate() !== 0) {
            this.drawingContext.translate(this.screenWidth / 2, this.screenHeight / 2);
            this.drawingContext.rotate(this.cameraClass.getRotate());
            this.drawingContext.translate(-this.screenWidth / 2, -this.screenHeight / 2);
        }

        if(this.remainShakeFrames && this.remainShakeFrames > 0) {
            this.remainShakeFrames--;
            this.drawingContext.translate(this.shakeThreshold - (Math.random() * (this.shakeThreshold * 2)), this.shakeThreshold - (Math.random() * (this.shakeThreshold * 2)));
        }

        if(this.mapClass) {
            this.mapClass.drawMap(this.drawingContext, this.cameraClass, this.screenWidth, this.screenHeight);
        }

        if(this.objectClass) {
            this.objectClass.drawObjects(this.drawingContext, this.cameraClass, this.screenWidth, this.screenHeight);
        }

        if(this.sightEffectClass) {
            this.sightEffectClass.updateSight(players, this.cameraClass, this.objectClass, this.mapClass);

            if(players) {
                for(var i = 0; i < players.length; i++) {
                    const player = players[players[i]];
                    if(player && !player.isOtherPlayer()){
                        this.survivorCharacterClass.drawCharacter(this.drawingContext, player, this.cameraClass, this.screenWidth, this.screenHeight);
                        break;
                    }
                }
            }

            this.drawingContext.save();

            if(!debugClass.debugGraphicsVisible) {
                this.sightEffectClass.clipSight(this.drawingContext);
            }
        }

        if(players) {
            for(var i = 0; i < players.length; i++) {
                const player = players[players[i]];
                if(player && player.isOtherPlayer() && this.cameraClass.containsPlayer(player)) {
                    this.survivorCharacterClass.drawCharacter(this.drawingContext, player, this.cameraClass, this.screenWidth, this.screenHeight);
                }
            }
        }

        if(npcs) {
            for(var i = 0; i < npcs.length; i++) {
                const npc = npcs[npcs[i]];
                if(npc && this.cameraClass.containsNpc(npc)) {
                    this.npcCharacterClass.drawCharacter(this.drawingContext, npc, this.cameraClass);
                }
            }
        }

        if(this.weatherClass) {
            //this.weatherClass.drawWeather(this.drawingContext);
        }

        if(this.sightEffectClass) {
            this.drawingContext.restore();
            this.sightEffectClass.drawSightLighting(this.drawingContext);
        }

        this.drawBullet(players);

        if(this.particleClass) {
            this.particleClass.drawParticles(this.drawingContext, this.cameraClass);
        }

        this.drawingContext.restore();

        if(this.uiClass) {
            this.uiClass.update(this.mapClass, players, npcs)
        }

        this.endScene();
    }

    drawBullet(players) {
        if (players) {
            for (var i = 0; i < players.length; i++) {
                const player = players[players[i]];
                if (player && player.getStatus() === 'shoot' && player.getCurrentStatusFrame() === 0) {
                    const shootInfo = player.getShootInfo();
                    if (shootInfo) {
                        this.drawingContext.beginPath();
                        this.drawingContext.moveTo(shootInfo.muzzle.x - this.cameraClass.getViewboxLeft(), shootInfo.muzzle.y - this.cameraClass.getViewboxTop());
                        if (shootInfo.hitObjectIntersection) {
                            this.drawingContext.lineTo(shootInfo.hitObjectIntersection.x - this.cameraClass.getViewboxLeft(), shootInfo.hitObjectIntersection.y - this.cameraClass.getViewboxTop());
                        } else {
                            this.drawingContext.lineTo(shootInfo.target.x - this.cameraClass.getViewboxLeft(), shootInfo.target.y - this.cameraClass.getViewboxTop());
                        }
                        this.drawingContext.strokeStyle = 'yellow';
                        this.drawingContext.stroke();
                    }
                }
            }
        }
    }

    drawPlayerName(playerClass, cameraClass) {
        if(playerClass) {

            const text = playerClass.getPlayerDescription();
            const fontHeightPixel = 14;
            const boxPadding = 5;

            const centerX = cameraClass.getCameraX() - cameraClass.getViewboxLeft();
            const centerY = cameraClass.getCameraY() - cameraClass.getViewboxTop() + boxPadding;

            this.drawingContext.font = "normal " + fontHeightPixel + "px MapoPeacefull";
            this.drawingContext.textBaseline = 'top';
            this.drawingContext.textAlign = 'center';
            var textWidth = this.drawingContext.measureText(text).width;

            this.drawingContext.beginPath();
            this.drawingContext.roundedRect(centerX - (textWidth / 2) - boxPadding, centerY - boxPadding, textWidth + (boxPadding * 2), fontHeightPixel + (boxPadding * 2), 5);
            this.drawingContext.fillStyle = '#000000A0';
            this.drawingContext.fill();

            this.drawingContext.fillStyle = "white";
            this.drawingContext.fillText(text, centerX, centerY);
        }
    }

    beginScene(drawingContext, r, g, b, a) {
        if(a > 0) {
            drawingContext.beginPath();
            drawingContext.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
            drawingContext.rect(0, 0, this.screenWidth, this.screenHeight);
            drawingContext.fill();
        } else {
            drawingContext.clearRect(0, 0, this.screenWidth, this.screenHeight);
        }
    }

    endScene() {
        // if(systemClass.pointerLockMode) {
            
        //     this.drawingContext.drawImage(this.offscreenCanvas, 0, 0, this.screenWidth, this.screenHeight);
        //     /*
        //     this.drawingContext.save();
        //     this.drawingContext.translate(this.screenWidth / 2,  this.screenHeight / 2);
        //     this.drawingContext.rotate(-(systemClass.getCurrentPlayerClass().getDirection() + 90) * (Math.PI / 180));
        //     this.drawingContext.drawImage(this.offscreenCanvas, -this.screenWidth / 2, -this.screenHeight / 2, this.screenWidth, this.screenHeight);
        //     this.drawingContext.restore();
        //     */
        // } else {
        //     this.drawingContext.drawImage(this.offscreenCanvas, 0, 0, this.screenWidth, this.screenHeight);
        // }
    }
}

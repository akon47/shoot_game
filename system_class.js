window.requestAnimFrame = (function (callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function (callback) { window.setTimeout(callback, 1000 / 60); };
})();

class SystemClass {
    constructor(window, rootDiv, canvas, uiCanvas) {
        this.isRunning = false;
        this.rootElement = rootDiv;
        this.canvas = canvas;
        this.renderFramesCount = 0;
        this.chatClass = new ChatClass(window, rootDiv, canvas);
        this.objectClass = new ObjectClass();
        this.graphicsClass = new GraphicsClass(canvas, uiCanvas, this.objectClass);
        this.inputClass = new InputClass(window, canvas);
        this.soundClass = new SoundClass();
        this.networkClass = new NetworkClass();
        this.currentId = undefined;
        this.pointerLockMode = false;
        this.players = [];
        this.npcs = [];
        this.connectedUserCount = 0;

        var self = this;
        //
        this.chatClass.chat = function (message) {
            if (self.currentId !== undefined) {
                self.networkClass.sendChat(message);
            }
        }
        this.chatClass.name = function (name) {
            const player = self.players[self.currentId];
            if (player) {
                player.setName(name);
                //self.networkClass.sendNameChanged(self.currentId, name);
            }
        }
        //
        this.inputClass.onmousedown = function (button) {
            const player = self.players[self.currentId];

            if (document.pointerLockElement === this.canvas || document.mozPointerLockElement === this.canvas) {
                //
            } else {
                if (self.pointerLockMode) {
                    canvas.requestPointerLock();
                }
            }
            // switch(button) {
            //     case MOUSE_LEFT_BUTTON:
            //         if (player) {
            //             player.shoot({ x: self.graphicsClass.cameraClass.getViewboxLeft() + self.inputClass.getCursorX(), y: self.graphicsClass.cameraClass.getViewboxTop() + self.inputClass.getCursorY() });
            //         }
            //         break;
            //     case MOUSE_RIGHT_BUTTON:
            //         if (player) {
            //             player.meleeAttack();
            //         }
            //         break;
            // }
            return true;
        }
        this.inputClass.onmouseup = function (button) {
            const player = self.players[self.currentId];
            switch (button) {
                case MOUSE_LEFT_BUTTON:
                    if (player) {
                        //player.idle();
                    }
                    break;
                case MOUSE_RIGHT_BUTTON:
                    break;
            }
            return true;
        }
        this.inputClass.onmousemove = function (x, y, movementX, movementY) {
            const player = self.players[self.currentId];
            if (player) {
                if (self.pointerLockMode) {
                    player.setDirection(player.getDirection() + (movementX / 4));
                }
            }
            return true;
        }

        this.inputClass.onkeyup = function (keyCode) {
            return true;
        }

        this.inputClass.onkeydown = function (keyCode) {

            const playerClass = self.players[self.currentId];
            if (playerClass) {
                var result = true;
                if (!self.chatClass.isInputActive()) {
                    switch (keyCode) {
                        case KEYCODE_LEFT_ARROW:
                        case KEYCODE_A:
                            break;
                        case KEYCODE_UP_ARROW:
                        case KEYCODE_W:
                            break;
                        case KEYCODE_RIGHT_ARROW:
                        case KEYCODE_D:
                            break;
                        case KEYCODE_DOWN_ARROW:
                        case KEYCODE_S:
                            break;
                        case KEYCODE_M:
                            self.graphicsClass.userInterfaceClass.minimapInterfaceClass.toggleVisible();
                            break;

                        case KEYCODE_1:
                            playerClass.setWeapon('knife');
                            break;
                        case KEYCODE_2:
                            playerClass.setWeapon('handgun');
                            break;
                        case KEYCODE_3:
                            playerClass.setWeapon('rifle');
                            break;
                        case KEYCODE_4:
                            //playerClass.setWeapon('shotgun');
                            break;
                        case KEYCODE_F:
                            //playerClass.setWeapon('flashlight');
                            break;
                        case KEYCODE_R:
                            playerClass.reload();
                            break;

                        case KEYCODE_PAGEUP:
                            //this.canvas.style.webkitTransform = 'rotate(45deg)';
                            break;
                        case KEYCODE_PAGEDOWN:
                            //self.graphicsClass.cameraClass.rotate -= (Math.PI / 180 * 5);
                            break;

                        case KEYCODE_F1:
                            debugClass.debugInfoVisible = !debugClass.debugInfoVisible;
                            break;
                        case KEYCODE_F2:
                            debugClass.debugGraphicsVisible = !debugClass.debugGraphicsVisible;
                            break;
                        case KEYCODE_F3:
                            self.togglePointerLockMode();
                            break;
                        case KEYCODE_F4:
                            self.soundClass.toggleMuted();
                            break;
                        case KEYCODE_F6:
                            debugClass.debugLowQualityMap = !debugClass.debugLowQualityMap;
                            break;
                        case KEYCODE_F7:
                            debugClass.black = !debugClass.black;
                            break;
                        case KEYCODE_F8:
                            var name = prompt('Enter a new name', undefined);
                            if (name) {
                                self.chatClass.setName(name);
                            }
                            break;
                        case KEYCODE_F9:
                            self.graphicsClass.drawingContext.imageSmoothingEnabled = !self.graphicsClass.drawingContext.imageSmoothingEnabled;
                            break;

                        case KEYCODE_TAB:
                            break;
                        case KEYCODE_TILDE:
                            break;
                        default:
                            result = false;
                            break;
                    }
                } else {
                    result = false;
                }


                return result;
            }
        }
        //
        this.networkClass.disconnected = function () {
            self.chatClass.writeToMessage('The connection with the server has been lost.<br/>');
            self.currentId = undefined;
            self.players = [];
            self.npcs = [];
            self.connectedUserCount = 0;
        }
        this.networkClass.tryreconnect = function (tryCount) {
            self.chatClass.writeToMessage('Attempt to connect with the server. (' + (tryCount) + ')<br/>');
        }


        this.networkClass.assignedid = function (id) {
            self.currentId = id;
            var player = self.addPlayer(id);
            if (player) {
                const placeableRandomPosition = self.graphicsClass.mapClass.getPlaceableRandomPosition();

                var playerName = getCookie('user_name');
                if (playerName === undefined) {
                    playerName = prompt('Enter a new name', undefined);
                    if (playerName) {
                        setCookie('user_name', name);
                    }
                }

                player.name = (getCookie('user_name'));
                player.character = (Math.floor(Math.random() * 100));
                player.x = (placeableRandomPosition.x);
                player.y = (placeableRandomPosition.y);
                self.networkClass.sendUserInit(player);
                self.chatClass.writeToMessage('You are connected.<br/>');
            } else {
                // ??
            }
        }
        this.networkClass.userconnected = function (id, name, x, y, speedX, speedY, direction, character, weapon, hp, kill, death) {
            var isNewConnection = (self.players[id] === undefined);
            var player = self.addPlayer(id);
            if (player && player != self.currentId) {
                player.setName(name);
                player.setPosition(x, y);
                player.setSpeed(speedX, speedY);
                player.setDirection(direction);
                player.setCharacter(character);
                player.setWeapon(weapon);
                player.setHp(hp);
                player.setKill(kill);
                player.setDeath(death);
            }
            if (id !== self.currentId && isNewConnection) {
                self.chatClass.writeToMessage('[' + self.players[id].getPlayerDescription() + '] has connected.<br/>');
            }
        }
        this.networkClass.userdisconnected = function (id) {
            self.chatClass.writeToMessage('[' + self.players[id].getPlayerDescription() + '] has disconnected.<br/>');
            self.removePlayer(id);
        }
        this.networkClass.usercountchanged = function (count) {
            self.connectedUserCount = count;
        }
        this.networkClass.usernamechanged = function (id, name) {
            var player = self.addPlayer(id);
            if (player && player.getId() !== self.currentId) {
                player.setName(name);
            }
        }
        this.networkClass.userspeedchanged = function (id, speedX, speedY) {
            var player = self.addPlayer(id);
            if (player && player.getId() !== self.currentId) {
                player.setSpeed(speedX, speedY);
            }
        }
        this.networkClass.userpositionchanged = function (id, x, y) {
            var player = self.addPlayer(id);
            if (player && player.getId() !== self.currentId) {
                player.setPosition(x, y);
            }
        }
        this.networkClass.userdirectionchanged = function (id, direction) {
            var player = self.addPlayer(id);
            if (player && player.getId() !== self.currentId) {
                player.setDirection(direction);
            }
        }
        this.networkClass.usercharacterchanged = function (id, character) {
            var player = self.addPlayer(id);
            if (player && player.getId() !== self.currentId) {
                player.setCharacter(character);
            }
        }
        this.networkClass.userweaponchanged = function (id, weapon) {
            var player = self.addPlayer(id);
            if (player && player.getId() !== self.currentId) {
                player.setWeapon(weapon);
            }
        }
        this.networkClass.userhpchanged = function (id, hp) {
            var player = self.addPlayer(id);
            if (player) {
                player.setHp(hp);
            }
        }
        this.networkClass.userdie = function (id, reason) {
            var player = self.addPlayer(id);
            if (player) {
                if (player.getId() === self.currentId) {
                    const placeableRandomPosition = self.graphicsClass.mapClass.getPlaceableRandomPosition();
                    player.setPosition(placeableRandomPosition.x, placeableRandomPosition.y);
                    player.resetAmmo();
                    self.networkClass.sendUserInit(player);
                }

                var providerName = '';
                switch (reason.provider) {
                    case 'user':
                    case 'ai':
                        const providerPlayer = self.players[reason.provider_id];
                        if (providerPlayer) {
                            providerName = providerPlayer.getPlayerDescription();
                        }
                        break;
                    case 'npc':
                        break;
                }
                self.chatClass.writeToMessage('<b>[' + providerName + '] -> [' + player.getPlayerDescription() + '] <font color=\"red\">KILL</font></b><br/>');
            }
        }
        this.networkClass.userkillchanged = function (id, kill) {
            var player = self.addPlayer(id);
            if (player) {
                player.setKill(kill);
            }
        }
        this.networkClass.userdeathchanged = function (id, death) {
            var player = self.addPlayer(id);
            if (player) {
                player.setDeath(death);
            }
        }

        this.networkClass.usershoot = function (id, weapon, muzzlePoint, targetPoint, angle) {
            var player = self.addPlayer(id);
            if (player && player.getId() !== self.currentId) {
                player.shoot(targetPoint, true);
            }
        }
        this.networkClass.userchat = function (id, chat) {
            if (id === 'server') {
                self.chatClass.writeToMessage('<b>[Server]: ' + chat + '</b><br/>');
            } else {
                self.addPlayer(id);
                if (self.players[id] !== undefined) {
                    self.players[id].setChat(chat);
                    self.chatClass.writeToMessage('[' + self.players[id].getPlayerDescription() + ']: ' + chat + '<br/>');
                }
            }
        }
        //
        this.networkClass.npccreated = function (id, x, y, destX, destY, speed, type, hp) {
            var npc = self.addNpc(id);
            if (npc) {
                npc.setPosition(x, y);
                npc.setSpeed(speed);
                npc.setDestination(destX, destY);
                npc.setType(type);
                npc.setHp(hp);
            }
        }
        this.networkClass.npcdeleted = function (id) {
            self.removeNpc(id);
        }
        this.networkClass.npcdestinationchanged = function (id, x, y, destX, destY) {
            var npc = self.addNpc(id);
            if (npc) {
                npc.setPosition(x, y);
                npc.setDestination(destX, destY);
            }
        }
        this.networkClass.npchpchanged = function (id, hp) {
            var npc = self.addNpc(id);
            if (npc) {
                npc.setHp(hp);
            }
        }
        //
    }

    getCurrentPlayerClass() {
        return this.players[this.currentId];
    }

    togglePointerLockMode() {
        this.pointerLockMode = !this.pointerLockMode;
        if (this.pointerLockMode) {

        } else {
            document.exitPointerLock();
        }

        if (document.pointerLockElement === this.canvas || document.mozPointerLockElement === this.canvas) {
            if (!this.pointerLockMode) {
                document.exitPointerLock();
            }
        } else {
            if (this.pointerLockMode) {
                this.canvas.requestPointerLock();
            }
        }
    }

    addPlayer(id) {
        if (this.players[id] === undefined) {
            this.players[id] = new PlayerClass(id, this.currentId !== id);
            this.players.push(id);

            var self = this;
            this.players[id].namechanged = function (player, name) {
                if (player.getId() === self.currentId) {
                    self.networkClass.sendNameChanged(name);
                }
            }
            this.players[id].positionchanged = function (player, x, y) {
                if (player.getId() === self.currentId) {
                    self.networkClass.sendPositionChanged(x, y);
                }
            }
            this.players[id].speedchanged = function (player, speedX, speedY) {
                if (player.getId() === self.currentId) {
                    self.networkClass.sendSpeedChanged(speedX, speedY);
                    if (player.getSpeedX() === 0 && player.getSpeedY() === 0) {
                        self.networkClass.sendPositionChanged(player.getPositionX(), player.getPositionY());
                    }
                }
            }
            this.players[id].directionchanged = function (player, direction) {
                if (player.getId() === self.currentId) {
                    self.networkClass.sendDirectionChanged(direction);
                    //self.canvas.style.webkitTransform = 'rotate(' + direction + 'deg)';
                }
            }
            this.players[id].characterchanged = function (player, character) {
                if (player.getId() === self.currentId) {
                    self.networkClass.sendCharacterChanged(character);
                }
            }
            this.players[id].weaponchanged = function (player, weapon) {
                if (player.getId() === self.currentId) {
                    self.networkClass.sendWeaponChanged(weapon);
                }
            }

            this.players[id].onshoot = function (player, weapon, muzzlePoint, targetPoint, angle) {
                var volume = 0.2, pan = 0.0;

                self.updateShootTarget(player);
                if (player.getId() === self.currentId) {
                    self.networkClass.sendShoot(weapon, muzzlePoint, targetPoint, angle);

                    var threadhold = 0, shakeFrames = 0;
                    switch (weapon) {
                        case 'handgun':
                            threadhold = 1;
                            shakeFrames = 6;
                            break;
                        case 'rifle':
                            threadhold = 2;
                            shakeFrames = 6;
                            break;
                        case 'shotgun':
                            threadhold = 5;
                            shakeFrames = 10;
                            break;
                    }
                    if (player.getSpeedX() !== 0 || player.getSpeedY() !== 0) {
                        threadhold *= 2;
                    }
                    self.graphicsClass.shakeScreen(threadhold, shakeFrames);
                } else {
                    const soundInfo = self.soundClass.getSoundVolumePanByPosition(
                        { x: self.graphicsClass.cameraClass.getViewboxCenterX(), y: self.graphicsClass.cameraClass.getViewboxCenterY() },
                        { x: muzzlePoint.x, y: muzzlePoint.y }
                    );

                    if (soundInfo) {
                        volume *= soundInfo.volume;
                        pan = soundInfo.pan;
                    }
                }

                self.updateShootIntersection(player);

                //console.log("Sound Pan: " + pan);
                if (volume > 0) {
                    self.soundClass.playWeaponSound(player, volume, pan);
                }

                if (player.shootInfo.hitObjectIntersection) {
                    var volume = 1.0, pan = 0.0;
                    const soundInfo = self.soundClass.getSoundVolumePanByPosition(
                        { x: self.graphicsClass.cameraClass.getViewboxCenterX(), y: self.graphicsClass.cameraClass.getViewboxCenterY() },
                        { x: player.shootInfo.hitObjectIntersection.x, y: player.shootInfo.hitObjectIntersection.y }
                    );
                    if (soundInfo) {
                        volume *= soundInfo.volume;
                        pan = soundInfo.pan;
                    }
                    self.soundClass.playImpactSound(volume, pan);
                } else {
                    self.graphicsClass.particleClass.setParticles(player.shootInfo);
                    //console.log(player.shootInfo);
                }
            }

            this.players[id].onmeleeattack = function (player, weapon) {
                if (player.getId() === self.currentId) {

                }
            }

            this.players[id].onreload = function (player, weapon) {
                var volume = 0.5, pan = 0.0;
                if (player.getId() === self.currentId) {
                    self.networkClass.sendReload(weapon);
                } else {
                    const soundInfo = self.soundClass.getSoundVolumePanByPosition(
                        { x: self.graphicsClass.cameraClass.getViewboxCenterX(), y: self.graphicsClass.cameraClass.getViewboxCenterY() },
                        { x: player.x, y: player.y }
                    );

                    if (soundInfo) {
                        volume *= soundInfo.volume;
                        pan = soundInfo.pan;
                    }
                }

                if (volume > 0) {
                    self.soundClass.playWeaponSound(player, volume, pan);
                }
            }
        }
        return this.players[id];
    }

    removePlayer(id) {
        if (this.players[id] !== undefined) {
            delete this.players[id];
        }
    }

    addNpc(id) {
        if (this.npcs[id] === undefined) {
            this.npcs[id] = new NpcClass(id);
            this.npcs.push(id);
        }
        return this.npcs[id];
    }

    removeNpc(id) {
        if (this.npcs[id] !== undefined) {
            delete this.npcs[id];
        }
    }

    updateShootTarget(player) {
        function getRayIntersection(ray, segment) {
            // RAY in parametric: Point + Direction*T1
            var r_px = ray.a.x;
            var r_py = ray.a.y;
            var r_dx = ray.b.x - ray.a.x;
            var r_dy = ray.b.y - ray.a.y;

            // SEGMENT in parametric: Point + Direction*T2
            var s_px = segment.a.x;
            var s_py = segment.a.y;
            var s_dx = segment.b.x - segment.a.x;
            var s_dy = segment.b.y - segment.a.y;

            // 두 선이 평행하다면 접점 존재하지 않음.
            var r_mag = Math.sqrt(r_dx * r_dx + r_dy * r_dy);
            var s_mag = Math.sqrt(s_dx * s_dx + s_dy * s_dy);
            if (r_dx / r_mag == s_dx / s_mag && r_dy / r_mag == s_dy / s_mag) { // 기울기 같음
                return null;
            }

            // SOLVE FOR T1 & T2
            // r_px+r_dx*T1 = s_px+s_dx*T2 && r_py+r_dy*T1 = s_py+s_dy*T2
            // ==> T1 = (s_px+s_dx*T2-r_px)/r_dx = (s_py+s_dy*T2-r_py)/r_dy
            // ==> s_px*r_dy + s_dx*T2*r_dy - r_px*r_dy = s_py*r_dx + s_dy*T2*r_dx - r_py*r_dx
            // ==> T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx)
            var T2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / (s_dx * r_dy - s_dy * r_dx);
            var T1 = (s_px + s_dx * T2 - r_px) / r_dx;

            // Must be within parametic whatevers for RAY/SEGMENT
            if (T1 < 0) return null;
            if (T2 < 0 || T2 > 1) return null;

            // Return the POINT OF INTERSECTION
            return {
                x: r_px + r_dx * T1,
                y: r_py + r_dy * T1,
                param: T1
            };
        }

        if (player) {
            const segments = this.graphicsClass.mapClass.getSegments();
            const ray = { a: { x: player.shootInfo.muzzle.x, y: player.shootInfo.muzzle.y }, b: { x: player.shootInfo.target.x, y: player.shootInfo.target.y } };
            var closestIntersect = null;
            for (var i = 0; i < segments.length; i++) {
                var intersect = getRayIntersection(ray, segments[i]);
                if (!intersect) continue;
                if (!closestIntersect || intersect.param < closestIntersect.param) {
                    closestIntersect = intersect;
                }
            }
            if (closestIntersect) {
                player.shootInfo.target.x = closestIntersect.x;
                player.shootInfo.target.y = closestIntersect.y;
            }
        }

    }

    updateShootIntersection(player) {
        function shootIntersection(p1, p2, circleX, circleY, radius) {
            const circle = { centerX: circleX, centerY: circleY, radius: radius };
            var dp = { x: p2.x - p1.x, y: p2.y - p1.y };
            var a, b, c, bb4ac, mu1, mu2;

            a = dp.x * dp.x + dp.y * dp.y;
            b = 2 * (dp.x * (p1.x - circle.centerX) + dp.y * (p1.y - circle.centerY));
            c = circle.centerX * circle.centerX + circle.centerY * circle.centerY;
            c += p1.x * p1.x + p1.y * p1.y;
            c -= 2 * (circle.centerX * p1.x + circle.centerY * p1.y);
            c -= circle.radius * circle.radius;
            bb4ac = b * b - 4 * a * c;
            if (Math.abs(a) < Math.Epsilon || bb4ac < 0) {
                //  line does not intersect
                return undefined;
            }
            mu1 = (-b + Math.sqrt(bb4ac)) / (2 * a);
            mu2 = (-b - Math.sqrt(bb4ac)) / (2 * a);

            const result1 = { x: p1.x + mu1 * (p2.x - p1.x), y: p1.y + mu1 * (p2.y - p1.y) };
            const result2 = { x: p1.x + mu2 * (p2.x - p1.x), y: p1.y + mu2 * (p2.y - p1.y) };

            if ((Math.pow(result1.x - p1.x, 2) + Math.pow(result1.y - p1.y, 2)) < (Math.pow(result2.x - p1.x, 2) + Math.pow(result2.y - p1.y, 2))) {
                return result1;
            } else {
                return result2;
            }
        }

        if (this.players && this.npcs) {
            for (var i = 0; i < this.players.length; i++) {
                const player = this.players[this.players[i]];
                if (player && player.getStatus() === 'shoot' && player.getCurrentStatusFrame() === 0) {
                    const shootInfo = player.getShootInfo();
                    if (shootInfo) {
                        const p1 = shootInfo.muzzle;
                        const p2 = shootInfo.target;
                        const bulletBox = { left: Math.min(p1.x, p2.x), top: Math.min(p1.y, p2.y), right: Math.max(p1.x, p2.x), bottom: Math.max(p1.y, p2.y) };

                        var hitObject = undefined;
                        var hitObjectIntersection = undefined;
                        var hitObjectType = undefined;
                        var minDistance = 1000000000;
                        for (var j = 0; j < this.npcs.length; j++) {
                            const npc = this.npcs[this.npcs[j]];
                            if (npc) {
                                if (bulletBox.left < (npc.x + npc.width) && bulletBox.right > npc.x && bulletBox.top < (npc.y + npc.height) && bulletBox.bottom > npc.y) {
                                    var intersection = shootIntersection(p1, p2, npc.x + (npc.width / 2), npc.y + (npc.height / 2), 16);
                                    if (intersection) {
                                        const distance = (Math.pow(intersection.x - p1.x, 2) + Math.pow(intersection.y - p1.y, 2));
                                        if (distance < minDistance) {
                                            minDistance = distance;
                                            hitObject = npc;
                                            hitObjectIntersection = intersection;
                                            hitObjectType = 'npc';
                                        }
                                    }
                                }
                            }
                        }

                        for (var j = 0; j < this.players.length; j++) {
                            const player = this.players[this.players[j]];
                            if (player) {
                                if (bulletBox.left < (player.x + player.width) && bulletBox.right > player.x && bulletBox.top < (player.y + player.height) && bulletBox.bottom > player.y) {
                                    var intersection = shootIntersection(p1, p2, player.x + (player.width / 2), player.y + (player.height / 2), 16);
                                    if (intersection) {
                                        const distance = (Math.pow(intersection.x - p1.x, 2) + Math.pow(intersection.y - p1.y, 2));
                                        if (distance < minDistance) {
                                            minDistance = distance;
                                            hitObject = player;
                                            hitObjectIntersection = intersection;
                                            hitObjectType = 'user';
                                        }
                                    }
                                }
                            }
                        }

                        if (hitObject) {
                            player.shootInfo.hitObjectIntersection = hitObjectIntersection;
                        } else {
                            player.shootInfo.hitObjectIntersection = undefined;
                        }
                    }
                }
            }
        }
    }

    playersFrame() {
        var hitBoxes = [];
        if (this.graphicsClass.mapClass) {
            const hitBoxs = this.graphicsClass.mapClass.getHitBoxes();
            if (hitBoxs) {
                hitBoxes = hitBoxes.concat(this.graphicsClass.mapClass.getHitBoxes());
            }
        }
        if (this.objectClass) {
            const hitBoxs = this.objectClass.getHitBoxes();
            if (hitBoxs) {
                hitBoxes = hitBoxes.concat(this.objectClass.getHitBoxes());
            }
        }

        if (this.players) {
            for (var i = 0; i < this.players.length; i++) {
                const playerClass = this.players[this.players[i]];
                if (playerClass !== undefined) {
                    playerClass.frame(hitBoxes);
                }
            }

            const currentPlayerClass = this.players[this.currentId];
            if (currentPlayerClass) {
                this.graphicsClass.setCameraPosition(currentPlayerClass.getCenterX(), currentPlayerClass.getCenterY());

                const ammoInfo = currentPlayerClass.getCurrentAmmoInfo();
                if (ammoInfo) {
                    if (ammoInfo.currentAmmo <= 0) {
                        currentPlayerClass.reload();
                    }
                }
            }
        }
    }

    npcsframe() {
        if (this.npcs) {
            for (var i = 0; i < this.npcs.length; i++) {
                const npc = this.npcs[this.npcs[i]];
                if (npc !== undefined) {
                    npc.frame();
                }
            }
        }
    }

    inputFrame() {
        if (this.inputClass) {

            if (this.inputClass.isKeyDown(KEYCODE_TILDE)) {
                this.graphicsClass.uiClass.showInfoHUD();
            } else {
                this.graphicsClass.uiClass.hideInfoHUD();
            }

            const playerClass = this.players[this.currentId];
            if (playerClass) {

                if (this.inputClass.isKeyDown(KEYCODE_R)) {
                    playerClass.reload();
                } else if (this.inputClass.isKeyDown(KEYCODE_1)) {
                    playerClass.setWeapon('knife');
                } else if (this.inputClass.isKeyDown(KEYCODE_2)) {
                    playerClass.setWeapon('handgun');
                } else if (this.inputClass.isKeyDown(KEYCODE_3)) {
                    playerClass.setWeapon('rifle');
                }

                const baseSpeed = 3;
                var newPlayerSpeedX = 0, newPlayerSpeedY = 0, newPlayerDirection = playerClass.getDirection();

                if (this.pointerLockMode) {
                    if (!this.chatClass.isInputActive()) {
                        if (this.inputClass.isKeyDown(KEYCODE_LEFT_ARROW) || this.inputClass.isKeyDown(KEYCODE_A)) { // left
                            newPlayerSpeedX = -baseSpeed;
                        }
                        if (this.inputClass.isKeyDown(KEYCODE_UP_ARROW) || this.inputClass.isKeyDown(KEYCODE_W)) { // up
                            newPlayerSpeedY = -baseSpeed;
                        }
                        if (this.inputClass.isKeyDown(KEYCODE_RIGHT_ARROW) || this.inputClass.isKeyDown(KEYCODE_D)) { // right
                            newPlayerSpeedX = baseSpeed;
                        }
                        if (this.inputClass.isKeyDown(KEYCODE_DOWN_ARROW) || this.inputClass.isKeyDown(KEYCODE_S)) { // down
                            newPlayerSpeedY = baseSpeed;
                        }

                        if (newPlayerSpeedX !== 0 || newPlayerSpeedY !== 0) {
                            const moveVectorAngle = Math.atan2(newPlayerSpeedY, newPlayerSpeedX) + ((playerClass.getDirection() + 90) * (Math.PI / 180));
                            newPlayerSpeedX = Math.cos(moveVectorAngle) * baseSpeed;
                            newPlayerSpeedY = Math.sin(moveVectorAngle) * baseSpeed;
                        }
                    }
                } else {
                    if (!this.chatClass.isInputActive()) {
                        if (this.inputClass.isKeyDown(KEYCODE_LEFT_ARROW) || this.inputClass.isKeyDown(KEYCODE_A)) { // left
                            newPlayerSpeedX = -baseSpeed;
                        }
                        if (this.inputClass.isKeyDown(KEYCODE_UP_ARROW) || this.inputClass.isKeyDown(KEYCODE_W)) { // up
                            newPlayerSpeedY = -baseSpeed;
                        }
                        if (this.inputClass.isKeyDown(KEYCODE_RIGHT_ARROW) || this.inputClass.isKeyDown(KEYCODE_D)) { // right
                            newPlayerSpeedX = baseSpeed;
                        }
                        if (this.inputClass.isKeyDown(KEYCODE_DOWN_ARROW) || this.inputClass.isKeyDown(KEYCODE_S)) { // down
                            newPlayerSpeedY = baseSpeed;
                        }

                        const userInScreenX = playerClass.getCenterX() - this.graphicsClass.cameraClass.getViewboxLeft();
                        const userInScreenY = playerClass.getCenterY() - this.graphicsClass.cameraClass.getViewboxTop();
                        newPlayerDirection = (Math.atan2((this.inputClass.getCursorY() - userInScreenY), (this.inputClass.getCursorX() - userInScreenX)) * 180 / Math.PI);
                    }
                    playerClass.setDirection(newPlayerDirection);
                }

                playerClass.setSpeed(newPlayerSpeedX, newPlayerSpeedY);

                if (this.inputClass.isMouseLeftButtonDown()) {

                    if (this.pointerLockMode) {
                        playerClass.shoot(undefined);
                    } else {
                        const targetPoint = { x: this.graphicsClass.cameraClass.getViewboxLeft() + this.inputClass.getCursorX(), y: this.graphicsClass.cameraClass.getViewboxTop() + this.inputClass.getCursorY() };
                        if (Math.sqrt(Math.pow(targetPoint.x - playerClass.getCenterX(), 2) + Math.pow(targetPoint.y - playerClass.getCenterY(), 2)) > (playerClass.getWidth() * 2)) {
                            playerClass.shoot(targetPoint);
                        }
                    }
                } else if (this.inputClass.isMouseRightButtonDown()) {
                    playerClass.meleeAttack();
                }
            }
        }
    }

    run() {
        if (!this.isRunning) {
            this.isRunning = true;

            function onVsync(sender) {
                // do something

                sender.inputFrame();
                sender.playersFrame();
                sender.npcsframe();

                sender.soundClass.frame(sender.players, sender.graphicsClass);
                sender.graphicsClass.frame(sender.players, sender.npcs);


                if (debugClass) {
                    debugClass.frame();
                }

                //
                if (sender.isRunning) {
                    sender.renderFramesCount++;
                    requestAnimFrame(function () {
                        onVsync(sender);
                    });
                } else {
                    // stop
                }
            }

            onVsync(this);
        }
    }

    stop() {
        this.isRunning = false;
    }

    getRenderFramesCount() {
        return this.renderFramesCount;
    }
}
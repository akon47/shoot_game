const wsUri = "wss://www.kimhwan.kr:8081";
class NetworkClass {
    constructor() {
        this.isConnected = false;
        this.reconnectCount = 0;
        this.latency = 0;
        this.initializeWebSocket();
    }

    getLatency() {
        return this.latency;
    }

    initializeWebSocket() {
        var self = this;
        this.webSocket = new WebSocket(wsUri);
        this.webSocket.onopen = function (evt) { self.onOpen(evt) };
        this.webSocket.onclose = function (evt) { self.onClose(evt) };
        this.webSocket.onmessage = function (evt) { self.onMessage(evt) };
        this.webSocket.onerror = function (evt) { self.onError(evt) };
    }

    checkLatency(self) {
        if (self.isConnected) {
            self.webSocket.send(JSON.stringify({ type: 'echo', data: { tick: performance.now() } }));
        }
    }

    isConnected() {
        return this.isConnected;
    }

    onOpen(e) {
        this.isConnected = true;
        if (this.connected) {
            this.connected();
        }

        setTimeout(this.checkLatency, 1000, this);
    }

    onClose(e) {
        if (this.isConnected) {
            this.isConnected = false;
            if (this.disconnected) {
                this.disconnected();
            }
        }

        this.reconnectCount++;

        if (this.tryreconnect) {
            this.tryreconnect(this.reconnectCount);
        }

        var self = this;
        setTimeout(function () {
            self.initializeWebSocket();
        }, 1000);
    }

    onMessage(e) {
        var msg = JSON.parse(e.data);
        //console.log(e.data);
        switch (msg.type) {
            case 'echo':
                if (msg.data.tick) {
                    const now = performance.now();
                    this.latency = Math.floor(now - msg.data.tick);
                    setTimeout(this.checkLatency, 1000, this);
                }
                break;
            case 'id':
                if (this.assignedid) {
                    this.assignedid(msg.data);
                }
                break;
            case 'user_connected':
                if (this.userconnected) {
                    this.userconnected(msg.data.id, msg.data.name, msg.data.x, msg.data.y, msg.data.speedX, msg.data.speedY, msg.data.direction, msg.data.character, msg.data.weapon, msg.data.hp, msg.data.kill, msg.data.death);
                }
                break;
            case 'user_disconnected':
                if (this.userdisconnected) {
                    this.userdisconnected(msg.data.id);
                }
                break;
            case 'user_count':
                if (this.usercountchanged) {
                    this.usercountchanged(msg.data);
                }
                break;
            case 'user_name':
                if (this.usernamechanged) {
                    this.usernamechanged(msg.data.id, msg.data.name);
                }
                break;
            case 'user_chat':
                if (this.userchat) {
                    this.userchat(msg.data.id, msg.data.chat);
                }
                break;
            case 'user_speed':
                if (this.userspeedchanged) {
                    this.userspeedchanged(msg.data.id, msg.data.speedX, msg.data.speedY);
                }
                break;
            case 'user_position':
                if (this.userpositionchanged) {
                    this.userpositionchanged(msg.data.id, msg.data.x, msg.data.y);
                }
                break;
            case 'user_direction':
                if (this.userdirectionchanged) {
                    this.userdirectionchanged(msg.data.id, msg.data.direction);
                }
                break;
            case 'user_character':
                if (this.usercharacterchanged) {
                    this.usercharacterchanged(msg.data.id, msg.data.character);
                }
                break;
            case 'user_weapon':
                if (this.userweaponchanged) {
                    this.userweaponchanged(msg.data.id, msg.data.weapon);
                }
                break;
            case 'user_shoot':
                if (this.usershoot) {
                    this.usershoot(msg.data.id, msg.data.weapon, msg.data.muzzlePoint, msg.data.targetPoint, msg.data.angle);
                }
                break;
            case 'user_hp':
                if (this.userhpchanged) {
                    this.userhpchanged(msg.data.id, msg.data.hp);
                }
                break;
            case 'user_die':
                if (this.userdie) {
                    this.userdie(msg.data.id, msg.data.reason);
                }
                break;
            case 'user_kill':
                if (this.userkillchanged) {
                    this.userkillchanged(msg.data.id, msg.data.kill);
                }
                break;
            case 'user_death':
                if (this.userdeathchanged) {
                    this.userdeathchanged(msg.data.id, msg.data.death);
                }
                break;

            case 'npc_created':
                if (this.npccreated) {
                    this.npccreated(msg.data.id, msg.data.x, msg.data.y, msg.data.destinationX, msg.data.destinationY, msg.data.speed, msg.data.type, msg.data.hp);
                }
                break;
            case 'npc_deleted':
                if (this.npcdeleted) {
                    this.npcdeleted(msg.data.id);
                }
                break;
            case 'npc_destination':
                if (this.npcdestinationchanged) {
                    this.npcdestinationchanged(msg.data.id, msg.data.x, msg.data.y, msg.data.destinationX, msg.data.destinationY);
                }
                break;
            case 'npc_hp':
                if (this.npchpchanged) {
                    this.npchpchanged(msg.data.id, msg.data.hp);
                }
                break;
        }
    }

    onError(e) {
        this.webSocket.close();
        console.log(e);
    }

    sendChat(chat) {
        this.webSocket.send(JSON.stringify({ type: 'user_chat', data: { chat: chat } }));
    }

    sendNameChanged(name) {
        this.webSocket.send(JSON.stringify({ type: 'user_name', data: { name: name } }));
    }

    sendSpeedChanged(speedX, speedY) {
        this.webSocket.send(JSON.stringify({ type: 'user_speed', data: { speedX: speedX, speedY: speedY } }));
    }

    sendPositionChanged(x, y) {
        this.webSocket.send(JSON.stringify({ type: 'user_position', data: { x: x, y: y } }));
    }

    sendCharacterChanged(character) {
        this.webSocket.send(JSON.stringify({ type: 'user_character', data: { character: character } }));
    }

    sendDirectionChanged(direction) {
        this.webSocket.send(JSON.stringify({ type: 'user_direction', data: { direction: direction } }));
    }

    sendWeaponChanged(weapon) {
        this.webSocket.send(JSON.stringify({ type: 'user_weapon', data: { weapon: weapon } }));
    }

    sendShoot(weapon, muzzlePoint, targetPoint, angle) {
        this.webSocket.send(JSON.stringify({ type: 'user_shoot', data: { weapon: weapon, muzzlePoint: muzzlePoint, targetPoint: targetPoint, angle: angle } }));
    }

    sendReload(weapon) {
        this.webSocket.send(JSON.stringify({ type: 'user_reload', data: { weapon: weapon } }));
    }

    sendUserInit(playerClass) {
        if (playerClass) {
            this.webSocket.send(JSON.stringify({
                type: 'user_init',
                data:
                {
                    name: playerClass.getName(),
                    x: playerClass.getPositionX(), y: playerClass.getPositionY(),
                    speedX: playerClass.getSpeedX(), speedY: playerClass.getSpeedY(),
                    direction: playerClass.getDirection(), character: playerClass.getCharacter(),
                    weapon: playerClass.getWeapon(), hp: playerClass.getHp()
                }
            }));
        }
    }
}

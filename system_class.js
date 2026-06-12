window.requestAnimFrame = (function (callback) {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
})();

// 리스폰 직후 무적 시간(ms). 서버의 SPAWN_PROTECTION_DURATION 과 같은 값을 유지해야 한다.
const SPAWN_PROTECTION_DURATION = 3000;

class SystemClass {
  constructor(window, rootDiv, canvas, uiCanvas) {
    this.isRunning = false;
    this.rootElement = rootDiv;
    this.canvas = canvas;
    this.renderFramesCount = 0;
    this.chatClass = new ChatClass(window, rootDiv, canvas);
    this.objectClass = new ObjectClass();
    this.itemManagerClass = new ItemManagerClass();
    this.graphicsClass = new GraphicsClass(canvas, uiCanvas, this.objectClass);
    this.inputClass = new InputClass(window, canvas);
    this.soundClass = new SoundClass();
    this.networkClass = new NetworkClass();
    this.currentId = undefined;
    this.pointerLockMode = false;
    this.players = [];
    this.connectedUserCount = 0;

    var self = this;
    this.chatClass.chat = function (message) {
      if (self.currentId !== undefined) {
        self.networkClass.sendChat(message);
      }
    };
    this.chatClass.name = function (name) {
      const player = self.players[self.currentId];
      if (player) {
        player.setName(name);
      }
    };
    this.inputClass.onmousedown = function (button) {
      // 포인터락 모드인데 아직 락이 걸려있지 않으면 클릭 시 다시 요청한다
      const isPointerLocked =
        document.pointerLockElement === this.canvas ||
        document.mozPointerLockElement === this.canvas;
      if (!isPointerLocked && self.pointerLockMode) {
        canvas.requestPointerLock();
      }
      return true;
    };
    this.inputClass.onmouseup = function (button) {
      return true;
    };
    this.inputClass.onmousemove = function (x, y, movementX, movementY) {
      const player = self.players[self.currentId];
      if (player) {
        if (self.pointerLockMode) {
          player.setDirection(player.getDirection() + movementX / 4);
        }
      }
      return true;
    };

    this.inputClass.onkeyup = function (keyCode) {
      return true;
    };

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
              self.graphicsClass.uiClass.minimapInterfaceClass.toggleVisible();
              break;

            case KEYCODE_1:
              playerClass.setWeapon("knife");
              break;
            case KEYCODE_2:
              playerClass.setWeapon("handgun");
              break;
            case KEYCODE_3:
              playerClass.setWeapon("rifle");
              break;
            case KEYCODE_4:
              playerClass.setWeapon("shotgun");
              break;
            case KEYCODE_R:
              playerClass.reload();
              break;

            case KEYCODE_F1:
              debugClass.debugInfoVisible = !debugClass.debugInfoVisible;
              break;
            case KEYCODE_F2:
              debugClass.debugGraphicsVisible =
                !debugClass.debugGraphicsVisible;
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
              localeClass.toggleLanguage();
              self.chatClass.writeToMessage(
                "<b>" + localeClass.getHtml("language_changed") + "</b><br/>",
              );
              break;
            case KEYCODE_F8:
              var name = prompt(
                localeClass.get("prompt_enter_name"),
                self.getCurrentPlayerClass().getName() ?? "",
              );
              if (name) {
                self.chatClass.name(name);
                setCookie("user_name", name);
              }
              break;
            case KEYCODE_F9:
              self.graphicsClass.drawingContext.imageSmoothingEnabled =
                !self.graphicsClass.drawingContext.imageSmoothingEnabled;
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
    };
    //
    this.networkClass.disconnected = function () {
      self.chatClass.writeToMessage(
        localeClass.getHtml("connection_lost") + "<br/>",
      );
      self.currentId = undefined;
      self.players = [];
      self.connectedUserCount = 0;
      self.itemManagerClass.setItems([]);
    };
    this.networkClass.tryreconnect = function (tryCount) {
      self.chatClass.writeToMessage(
        localeClass.getHtml("reconnecting", { count: tryCount }) + "<br/>",
      );
    };

    this.networkClass.assignedid = function (id) {
      self.currentId = id;
      const player = self.addPlayer(id);
      if (player) {
        const placeableRandomPosition =
          self.graphicsClass.mapClass.getPlaceableRandomPosition();
        let playerName = getCookie("user_name");
        if (playerName === null || playerName === "") {
          playerName = prompt(localeClass.get("prompt_enter_name"), undefined);
          if (playerName) {
            setCookie("user_name", playerName);
          }
        }

        player.name = getCookie("user_name");
        player.character = Math.floor(Math.random() * 100);
        player.x = placeableRandomPosition.x;
        player.y = placeableRandomPosition.y;
        self.networkClass.sendUserInit(player);
        player.setSpawnProtection(SPAWN_PROTECTION_DURATION);
        self.chatClass.writeToMessage(
          localeClass.getHtml("connected") + "<br/>",
        );
      }
    };
    this.networkClass.userconnected = function (
      id,
      name,
      x,
      y,
      speedX,
      speedY,
      direction,
      character,
      weapon,
      hp,
      kill,
      death,
      protectedMs,
    ) {
      var isNewConnection = self.players[id] === undefined;
      var player = self.addPlayer(id);
      if (player && player.getId() !== self.currentId) {
        player.setName(name);
        player.setPosition(x, y);
        player.setSpeed(speedX, speedY);
        player.setDirection(direction);
        player.setCharacter(character);
        player.setWeapon(weapon);
        player.setHp(hp);
        player.setKill(kill);
        player.setDeath(death);
        player.setSpawnProtection(protectedMs);
      }
      if (id !== self.currentId && isNewConnection) {
        self.chatClass.writeToMessage(
          localeClass.getHtml("player_joined", {
            name: self.players[id].getPlayerDescription(),
          }) + "<br/>",
        );
      }
    };
    this.networkClass.userdisconnected = function (id) {
      const player = self.players[id];
      if (player) {
        self.chatClass.writeToMessage(
          localeClass.getHtml("player_left", {
            name: player.getPlayerDescription(),
          }) + "<br/>",
        );
        self.removePlayer(id);
      }
    };
    this.networkClass.usercountchanged = function (count) {
      self.connectedUserCount = count;
    };
    this.networkClass.usernamechanged = function (id, name) {
      const player = self.addPlayer(id);
      if (player && player.getId() !== self.currentId) {
        player.setName(name);
      }
    };
    this.networkClass.userspeedchanged = function (id, speedX, speedY) {
      const player = self.addPlayer(id);
      if (player && player.getId() !== self.currentId) {
        player.setSpeed(speedX, speedY);
      }
    };
    this.networkClass.userpositionchanged = function (id, x, y) {
      const player = self.addPlayer(id);
      if (player && player.getId() !== self.currentId) {
        player.setPosition(x, y);
      }
    };
    this.networkClass.userdirectionchanged = function (id, direction) {
      const player = self.addPlayer(id);
      if (player && player.getId() !== self.currentId) {
        player.setDirection(direction);
      }
    };
    this.networkClass.usercharacterchanged = function (id, character) {
      const player = self.addPlayer(id);
      if (player && player.getId() !== self.currentId) {
        player.setCharacter(character);
      }
    };
    this.networkClass.userweaponchanged = function (id, weapon) {
      const player = self.addPlayer(id);
      if (player && player.getId() !== self.currentId) {
        player.setWeapon(weapon);
      }
    };
    this.networkClass.userhpchanged = function (id, hp) {
      const player = self.addPlayer(id);
      if (player) {
        player.setHp(hp);
      }
    };
    this.networkClass.userdie = function (id, reason) {
      const player = self.addPlayer(id);
      if (player) {
        if (player.getId() === self.currentId) {
          const placeableRandomPosition =
            self.graphicsClass.mapClass.getPlaceableRandomPosition();
          player.setPosition(
            placeableRandomPosition.x,
            placeableRandomPosition.y,
          );
          // 서버는 user_init 수신 시 hp를 100으로 되돌리지만, 본인 user_connected 는
          // 클라이언트가 무시하므로 로컬 hp도 여기서 직접 되돌려야 한다
          player.setHp(100);
          player.resetAmmo();
          self.networkClass.sendUserInit(player);
          player.setSpawnProtection(SPAWN_PROTECTION_DURATION);
        }
        const providerPlayer = self.players[reason.provider_id];
        if (providerPlayer) {
          self.graphicsClass.uiClass.writeDieMessage(
            player,
            providerPlayer,
            reason,
          );
        }
      }
    };
    this.networkClass.userkillchanged = function (id, kill) {
      const player = self.addPlayer(id);
      if (player) {
        player.setKill(kill);
      }
    };
    this.networkClass.userdeathchanged = function (id, death) {
      const player = self.addPlayer(id);
      if (player) {
        player.setDeath(death);
      }
    };

    this.networkClass.usershoot = function (
      id,
      weapon,
      muzzlePoint,
      targetPoints,
      angle,
    ) {
      const player = self.addPlayer(id);
      if (player && player.getId() !== self.currentId) {
        // 서버가 중계한 탄도(targetPoints)를 그대로 재현한다
        player.shoot(
          targetPoints && targetPoints.length > 0 ? targetPoints[0] : undefined,
          true,
          targetPoints,
        );
      }
    };
    this.networkClass.usermeleeattack = function (id, weapon) {
      const player = self.addPlayer(id);
      if (player && player.getId() !== self.currentId) {
        player.meleeAttack();
      }
    };
    this.networkClass.userreload = function (id, weapon) {
      const player = self.addPlayer(id);
      if (player && player.getId() !== self.currentId) {
        player.reload();
      }
    };
    this.networkClass.itemlist = function (items) {
      self.itemManagerClass.setItems(items);
    };
    this.networkClass.itemspawn = function (item) {
      self.itemManagerClass.addItem(item);
    };
    this.networkClass.itempicked = function (itemId, by, type) {
      self.itemManagerClass.removeItem(itemId);
      if (by === self.currentId) {
        if (type === "medkit") {
          self.chatClass.writeToMessage(
            '<b><font color="lightgreen">' +
              localeClass.getHtml("pickup_medkit") +
              "</font></b><br/>",
          );
        } else if (type === "ammo") {
          self.chatClass.writeToMessage(
            '<b><font color="yellow">' +
              localeClass.getHtml("pickup_ammo") +
              "</font></b><br/>",
          );
        }
      }
    };
    this.networkClass.ammorefill = function () {
      const player = self.players[self.currentId];
      if (player) {
        player.resetAmmo();
      }
    };
    this.networkClass.roundinfo = function (remainMs) {
      self.roundRemainMs = remainMs;
      self.roundInfoReceivedAt = performance.now();
    };
    // 서버 공지(킬스트릭/라운드)는 key+params 로 받아 현재 언어로 렌더링한다
    this.networkClass.servernotice = function (key, params) {
      self.chatClass.writeToMessage(
        "<b>" + localeClass.getServerNoticeHtml(key, params) + "</b><br/>",
      );
    };
    this.networkClass.userchat = function (id, chat) {
      if (id === "server") {
        self.chatClass.writeToMessage("<b>[Server]: " + chat + "</b><br/>");
      } else {
        self.addPlayer(id);
        if (self.players[id] !== undefined) {
          self.players[id].setChat(chat);
          self.chatClass.writeToMessage(
            "[" +
              escapeHtml(self.players[id].getPlayerDescription()) +
              "]: " +
              chat +
              "<br/>",
          );
        }
      }
    };
    this.networkClass.userchathistory = function (chats) {
      if (chats) {
        for (let i = 0; i < chats.length; i++) {
          let description = chats[i].name;
          if (
            !chats[i].name ||
            chats[i].name.length === 0 ||
            !chats[i].name.trim()
          ) {
            description = chats[i].id;
          }
          self.chatClass.writeToMessage(
            "[" + escapeHtml(description) + "]: " + chats[i].chat + "<br/>",
          );
        }
      }
    };
  }

  getCurrentPlayerClass() {
    return this.players[this.currentId];
  }

  togglePointerLockMode() {
    this.pointerLockMode = !this.pointerLockMode;
    if (this.pointerLockMode) {
      this.canvas.requestPointerLock();
    } else {
      document.exitPointerLock();
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
      };
      this.players[id].positionchanged = function (player, x, y) {
        if (player.getId() === self.currentId) {
          self.networkClass.sendPositionChanged(x, y);
        }
      };
      this.players[id].speedchanged = function (player, speedX, speedY) {
        if (player.getId() === self.currentId) {
          self.networkClass.sendSpeedChanged(speedX, speedY);
          if (player.getSpeedX() === 0 && player.getSpeedY() === 0) {
            self.networkClass.sendPositionChanged(
              player.getPositionX(),
              player.getPositionY(),
            );
          }
        }
      };
      this.players[id].directionchanged = function (player, direction) {
        if (player.getId() === self.currentId) {
          self.networkClass.sendDirectionChanged(direction);
        }
      };
      this.players[id].characterchanged = function (player, character) {
        if (player.getId() === self.currentId) {
          self.networkClass.sendCharacterChanged(character);
        }
      };
      this.players[id].weaponchanged = function (player, weapon) {
        if (player.getId() === self.currentId) {
          self.networkClass.sendWeaponChanged(weapon);
        }
      };

      this.players[id].onshoot = function (
        player,
        weapon,
        muzzlePoint,
        targets,
        angle,
      ) {
        var volume = 0.1,
          pan = 0.0;

        self.updateShootTarget(player);
        if (player.getId() === self.currentId) {
          // updateShootTarget 으로 벽에 맞게 잘린 탄도를 보낸다
          self.networkClass.sendShoot(
            weapon,
            muzzlePoint,
            player.shootInfo.targets,
            angle,
          );

          var threshold = 0,
            shakeFrames = 0;
          switch (weapon) {
            case "handgun":
              threshold = 1;
              shakeFrames = 6;
              break;
            case "rifle":
              threshold = 2;
              shakeFrames = 6;
              break;
            case "shotgun":
              threshold = 5;
              shakeFrames = 10;
              break;
          }
          if (player.getSpeedX() !== 0 || player.getSpeedY() !== 0) {
            threshold *= 2;
          }
          self.graphicsClass.shakeScreen(threshold, shakeFrames);
        } else {
          const soundInfo = self.soundClass.getSoundVolumePanByPosition(
            {
              x: self.graphicsClass.cameraClass.getViewboxCenterX(),
              y: self.graphicsClass.cameraClass.getViewboxCenterY(),
            },
            { x: muzzlePoint.x, y: muzzlePoint.y },
          );

          if (soundInfo) {
            volume *= soundInfo.volume;
            pan = soundInfo.pan;
          }
        }

        self.updateShootIntersection(player);

        if (volume > 0) {
          self.soundClass.playWeaponSound(player, volume, pan);
        }

        if (player.shootInfo.hitObjectIntersection) {
          var volume = 1.0,
            pan = 0.0;
          const soundInfo = self.soundClass.getSoundVolumePanByPosition(
            {
              x: self.graphicsClass.cameraClass.getViewboxCenterX(),
              y: self.graphicsClass.cameraClass.getViewboxCenterY(),
            },
            {
              x: player.shootInfo.hitObjectIntersection.x,
              y: player.shootInfo.hitObjectIntersection.y,
            },
          );
          if (soundInfo) {
            volume *= soundInfo.volume;
            pan = soundInfo.pan;
          }
          self.soundClass.playImpactSound(volume, pan);
        }
        // 명중하지 않은 탄도(펠릿)는 setParticles 내부에서 골라 불꽃을 만든다
        self.graphicsClass.particleClass.setParticles(player.shootInfo);
      };

      this.players[id].onmeleeattack = function (player, weapon) {
        if (player.getId() === self.currentId) {
          self.networkClass.sendMeleeAttack(weapon);
        }
      };

      this.players[id].onreload = function (player, weapon) {
        var volume = 0.5,
          pan = 0.0;
        if (player.getId() === self.currentId) {
          self.networkClass.sendReload(weapon);
        } else {
          const soundInfo = self.soundClass.getSoundVolumePanByPosition(
            {
              x: self.graphicsClass.cameraClass.getViewboxCenterX(),
              y: self.graphicsClass.cameraClass.getViewboxCenterY(),
            },
            { x: player.x, y: player.y },
          );

          if (soundInfo) {
            volume *= soundInfo.volume;
            pan = soundInfo.pan;
          }
        }

        if (volume > 0) {
          self.soundClass.playWeaponSound(player, volume, pan);
        }
      };
    }
    return this.players[id];
  }

  removePlayer(id) {
    if (this.players[id] !== undefined) {
      delete this.players[id];
      const index = this.players.indexOf(id);
      if (index >= 0) {
        this.players.splice(index, 1);
      }
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
      if (r_dx / r_mag == s_dx / s_mag && r_dy / r_mag == s_dy / s_mag) {
        // 기울기 같음
        return null;
      }

      // SOLVE FOR T1 & T2
      // r_px+r_dx*T1 = s_px+s_dx*T2 && r_py+r_dy*T1 = s_py+s_dy*T2
      // ==> T1 = (s_px+s_dx*T2-r_px)/r_dx = (s_py+s_dy*T2-r_py)/r_dy
      // ==> s_px*r_dy + s_dx*T2*r_dy - r_px*r_dy = s_py*r_dx + s_dy*T2*r_dx - r_py*r_dx
      // ==> T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx)
      var T2 =
        (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) /
        (s_dx * r_dy - s_dy * r_dx);
      var T1 = (s_px + s_dx * T2 - r_px) / r_dx;

      // Must be within parametic whatevers for RAY/SEGMENT
      if (T1 < 0) return null;
      if (T2 < 0 || T2 > 1) return null;

      // Return the POINT OF INTERSECTION
      return {
        x: r_px + r_dx * T1,
        y: r_py + r_dy * T1,
        param: T1,
      };
    }

    if (player) {
      const segments = this.graphicsClass.mapClass.getSegments();
      const targets = player.shootInfo.targets
        ? player.shootInfo.targets
        : [player.shootInfo.target];
      for (let t = 0; t < targets.length; t++) {
        const ray = {
          a: { x: player.shootInfo.muzzle.x, y: player.shootInfo.muzzle.y },
          b: { x: targets[t].x, y: targets[t].y },
        };
        var closestIntersect = null;
        for (let i = 0; i < segments.length; i++) {
          var intersect = getRayIntersection(ray, segments[i]);
          if (!intersect) continue;
          if (!closestIntersect || intersect.param < closestIntersect.param) {
            closestIntersect = intersect;
          }
        }
        if (closestIntersect) {
          targets[t].x = closestIntersect.x;
          targets[t].y = closestIntersect.y;
        }
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
      if (Math.abs(a) < Number.EPSILON || bb4ac < 0) {
        //  line does not intersect
        return undefined;
      }
      mu1 = (-b + Math.sqrt(bb4ac)) / (2 * a);
      mu2 = (-b - Math.sqrt(bb4ac)) / (2 * a);

      const result1 = {
        x: p1.x + mu1 * (p2.x - p1.x),
        y: p1.y + mu1 * (p2.y - p1.y),
      };
      const result2 = {
        x: p1.x + mu2 * (p2.x - p1.x),
        y: p1.y + mu2 * (p2.y - p1.y),
      };

      if (
        Math.pow(result1.x - p1.x, 2) + Math.pow(result1.y - p1.y, 2) <
        Math.pow(result2.x - p1.x, 2) + Math.pow(result2.y - p1.y, 2)
      ) {
        return result1;
      } else {
        return result2;
      }
    }

    if (this.players) {
      for (let i = 0; i < this.players.length; i++) {
        const shooter = this.players[this.players[i]];
        if (
          shooter &&
          shooter.getStatus() === "shoot" &&
          shooter.getCurrentStatusFrame() === 0
        ) {
          const shootInfo = shooter.getShootInfo();
          if (shootInfo) {
            const targets = shootInfo.targets
              ? shootInfo.targets
              : [shootInfo.target];
            shootInfo.hitObjectIntersections = new Array(targets.length);
            shootInfo.hitObjectIntersection = undefined;

            for (let t = 0; t < targets.length; t++) {
              const p1 = shootInfo.muzzle;
              const p2 = targets[t];
              const bulletBox = {
                left: Math.min(p1.x, p2.x),
                top: Math.min(p1.y, p2.y),
                right: Math.max(p1.x, p2.x),
                bottom: Math.max(p1.y, p2.y),
              };

              var hitObjectIntersection = undefined;
              var minDistance = 1000000000;

              for (let j = 0; j < this.players.length; j++) {
                const player = this.players[this.players[j]];
                // 스폰 무적 상태인 플레이어는 서버에서도 피격되지 않으므로 시각 효과도 생략
                if (player && !player.isSpawnProtected()) {
                  if (
                    bulletBox.left < player.x + player.width &&
                    bulletBox.right > player.x &&
                    bulletBox.top < player.y + player.height &&
                    bulletBox.bottom > player.y
                  ) {
                    var intersection = shootIntersection(
                      p1,
                      p2,
                      player.x + player.width / 2,
                      player.y + player.height / 2,
                      16,
                    );
                    if (intersection) {
                      const distance =
                        Math.pow(intersection.x - p1.x, 2) +
                        Math.pow(intersection.y - p1.y, 2);
                      if (distance < minDistance) {
                        minDistance = distance;
                        hitObjectIntersection = intersection;
                      }
                    }
                  }
                }
              }

              shootInfo.hitObjectIntersections[t] = hitObjectIntersection;
              if (
                hitObjectIntersection &&
                shootInfo.hitObjectIntersection === undefined
              ) {
                shootInfo.hitObjectIntersection = hitObjectIntersection;
              }
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
      for (let i = 0; i < this.players.length; i++) {
        const playerClass = this.players[this.players[i]];
        if (playerClass !== undefined) {
          playerClass.frame(hitBoxes);
        }
      }

      const currentPlayerClass = this.players[this.currentId];
      if (currentPlayerClass) {
        this.graphicsClass.setCameraPosition(
          currentPlayerClass.getCenterX(),
          currentPlayerClass.getCenterY(),
        );

        const ammoInfo = currentPlayerClass.getCurrentAmmoInfo();
        if (ammoInfo) {
          if (ammoInfo.currentAmmo <= 0) {
            currentPlayerClass.reload();
          }
        }
      }
    }
  }

  inputFrame() {
    if (this.inputClass) {
      if (
        this.inputClass.isKeyDown(KEYCODE_TILDE) ||
        this.inputClass.isKeyDown(KEYCODE_TAB)
      ) {
        this.graphicsClass.uiClass.showInfoHUD();
      } else {
        this.graphicsClass.uiClass.hideInfoHUD();
      }

      const playerClass = this.players[this.currentId];
      if (playerClass) {
        if (this.inputClass.isKeyDown(KEYCODE_R)) {
          playerClass.reload();
        } else if (this.inputClass.isKeyDown(KEYCODE_1)) {
          playerClass.setWeapon("knife");
        } else if (this.inputClass.isKeyDown(KEYCODE_2)) {
          playerClass.setWeapon("handgun");
        } else if (this.inputClass.isKeyDown(KEYCODE_3)) {
          playerClass.setWeapon("rifle");
        } else if (this.inputClass.isKeyDown(KEYCODE_4)) {
          playerClass.setWeapon("shotgun");
        }
        playerClass.setRunning(this.inputClass.isKeyDown(KEYCODE_SHIFT));

        const baseSpeed = playerClass.getBaseSpeed();
        var newPlayerSpeedX = 0,
          newPlayerSpeedY = 0,
          newPlayerDirection = playerClass.getDirection();

        if (!this.chatClass.isInputActive()) {
          if (
            this.inputClass.isKeyDown(KEYCODE_LEFT_ARROW) ||
            this.inputClass.isKeyDown(KEYCODE_A)
          ) {
            newPlayerSpeedX = -baseSpeed;
          }
          if (
            this.inputClass.isKeyDown(KEYCODE_UP_ARROW) ||
            this.inputClass.isKeyDown(KEYCODE_W)
          ) {
            newPlayerSpeedY = -baseSpeed;
          }
          if (
            this.inputClass.isKeyDown(KEYCODE_RIGHT_ARROW) ||
            this.inputClass.isKeyDown(KEYCODE_D)
          ) {
            newPlayerSpeedX = baseSpeed;
          }
          if (
            this.inputClass.isKeyDown(KEYCODE_DOWN_ARROW) ||
            this.inputClass.isKeyDown(KEYCODE_S)
          ) {
            newPlayerSpeedY = baseSpeed;
          }

          if (this.pointerLockMode) {
            // 포인터락 모드: 캐릭터가 보는 방향 기준의 상대 이동
            if (newPlayerSpeedX !== 0 || newPlayerSpeedY !== 0) {
              const moveVectorAngle =
                Math.atan2(newPlayerSpeedY, newPlayerSpeedX) +
                (playerClass.getDirection() + 90) * (Math.PI / 180);
              newPlayerSpeedX = Math.cos(moveVectorAngle) * baseSpeed;
              newPlayerSpeedY = Math.sin(moveVectorAngle) * baseSpeed;
            }
          } else {
            // 일반 모드: 마우스 커서를 바라보도록 방향 갱신
            const userInScreenX =
              playerClass.getCenterX() -
              this.graphicsClass.cameraClass.getViewboxLeft();
            const userInScreenY =
              playerClass.getCenterY() -
              this.graphicsClass.cameraClass.getViewboxTop();
            newPlayerDirection =
              (Math.atan2(
                this.inputClass.getCursorY() - userInScreenY,
                this.inputClass.getCursorX() - userInScreenX,
              ) *
                180) /
              Math.PI;
          }
        }

        if (!this.pointerLockMode) {
          playerClass.setDirection(newPlayerDirection);
        }
        playerClass.setSpeed(newPlayerSpeedX, newPlayerSpeedY);

        if (this.inputClass.isMouseLeftButtonDown()) {
          if (this.pointerLockMode) {
            playerClass.shoot(undefined);
          } else {
            const targetPoint = {
              x:
                this.graphicsClass.cameraClass.getViewboxLeft() +
                this.inputClass.getCursorX(),
              y:
                this.graphicsClass.cameraClass.getViewboxTop() +
                this.inputClass.getCursorY(),
            };
            if (
              Math.sqrt(
                Math.pow(targetPoint.x - playerClass.getCenterX(), 2) +
                  Math.pow(targetPoint.y - playerClass.getCenterY(), 2),
              ) >
              playerClass.getWidth() * 2
            ) {
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
        sender.inputFrame();
        sender.playersFrame();

        sender.soundClass.frame(sender.players, sender.graphicsClass);
        sender.graphicsClass.frame(sender.players);

        if (debugClass) {
          debugClass.frame();
        }

        if (sender.isRunning) {
          sender.renderFramesCount++;
          requestAnimFrame(function () {
            onVsync(sender);
          });
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

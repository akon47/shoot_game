// SoundJS(createjs) 래퍼. BGM/효과음 등록과 위치 기반 볼륨/팬 계산을 담당한다.
class SoundClass {
  constructor() {
    var self = this;

    this.muted = false;

    this.stepSounds = [];
    this.playedStepIndex = 0;
    this.lastStepPlayedTime = 0;
    this.stepSounds.push("sound/step_1.mp3");
    this.stepSounds.push("sound/step_2.mp3");

    this.weaponSounds = ["handgun", "rifle", "shotgun"];
    this.weaponSounds["handgun"] = [];
    this.weaponSounds["handgun"].shoot = "sound/handgun_shoot.mp3";
    this.weaponSounds["handgun"].reload = "sound/handgun_reload.mp3";

    this.weaponSounds["rifle"] = [];
    this.weaponSounds["rifle"].shoot = "sound/rifle_shoot.mp3";
    this.weaponSounds["rifle"].reload = "sound/rifle_reload.mp3";

    this.weaponSounds["shotgun"] = [];
    this.weaponSounds["shotgun"].shoot = "sound/shotgun_shoot.mp3";
    this.weaponSounds["shotgun"].reload = "sound/shotgun_reload.mp3";

    this.bgm = "sound/200 Upbeat, Futuristic Area (Loop, 160kbps).mp3";

    this.impactSounds = [];
    this.impactSounds.push("./sound/impact/Impact_Flesh_001.mp3");
    this.impactSounds.push("./sound/impact/Impact_Flesh_002.mp3");
    this.impactSounds.push("./sound/impact/Impact_Flesh_003.mp3");

    this.loadedSounds = 0;
    createjs.Sound.addEventListener("fileload", function (e) {
      console.log("fileload -> " + e.src);
      if (e.src === self.bgm) {
        createjs.Sound.play(
          self.bgm,
          new createjs.PlayPropsConfig().set({
            interrupt: createjs.Sound.INTERRUPT_ANY,
            loop: -1,
            volume: 0.05,
          }),
        );
      }
      self.loadedSounds++;
    });
    createjs.Sound.addEventListener("fileerror", function (e) {
      console.log("fileerror -> " + e.src);
      self.loadedSounds++;
    });

    // 등록할 사운드를 한곳에 모아 등록하고, 로드 완료 판정은 그 개수를 기준으로 한다
    const soundsToRegister = [this.bgm]
      .concat(this.stepSounds)
      .concat(this.impactSounds);
    for (let i = 0; i < this.weaponSounds.length; i++) {
      const weaponSoundInfo = this.weaponSounds[this.weaponSounds[i]];
      if (weaponSoundInfo) {
        if (weaponSoundInfo.shoot) {
          soundsToRegister.push(weaponSoundInfo.shoot);
        }
        if (weaponSoundInfo.reload) {
          soundsToRegister.push(weaponSoundInfo.reload);
        }
      }
    }

    this.totalSounds = soundsToRegister.length;
    for (let i = 0; i < soundsToRegister.length; i++) {
      createjs.Sound.registerSound(soundsToRegister[i], soundsToRegister[i]);
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  isMuted() {
    return this.muted;
  }

  toggleMuted() {
    this.muted = !this.muted;
    createjs.Sound.muted = this.muted;
  }

  isLoaded() {
    return this.loadedSounds >= this.totalSounds;
  }

  getSoundVolumePanByPosition(ear, sound) {
    const earX = ear.x;
    const earY = ear.y;
    const soundX = sound.x;
    const soundY = sound.y;

    const dx = soundX - earX;
    const dy = soundY - earY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    var volume = 1.0,
      pan = 0.0;

    volume = Math.max(0, 1.0 - distance / 1500);

    if (volume > 0) {
      const soundAngle = Math.atan2(soundY - earY, soundX - earX);

      if (soundAngle >= -Math.PI && soundAngle < -(Math.PI / 2)) {
        // lefttop
        pan = soundAngle / (Math.PI / 2) + 1;
      } else if (soundAngle > -(Math.PI / 2) && soundAngle <= 0) {
        // righttop
        pan = soundAngle / (Math.PI / 2) + 1;
      } else if (soundAngle >= 0 && soundAngle < Math.PI / 2) {
        // rightbottom
        pan = 1 - soundAngle / (Math.PI / 2);
      } else if (soundAngle > Math.PI / 2 && soundAngle <= Math.PI) {
        // leftbottom
        pan = 1 - soundAngle / (Math.PI / 2);
      }
    }

    return { volume: volume, pan: pan };
  }

  playImpactSound(volume, pan) {
    if (this.muted) {
      return;
    }

    volume = volume ? volume : 1.0;
    pan = pan ? pan : 0;

    createjs.Sound.play(
      this.impactSounds[Math.floor(Math.random() * this.impactSounds.length)],
      new createjs.PlayPropsConfig().set({ volume: volume, pan: pan }),
    );
  }

  playWeaponSound(playerClass, volume, pan) {
    if (this.muted) {
      return;
    }

    volume = volume ? volume : 0.5;
    pan = pan ? pan : 0;

    switch (playerClass.getStatus()) {
      case "shoot":
        if (playerClass.getCurrentStatusFrame() == 0) {
          createjs.Sound.play(
            this.weaponSounds[playerClass.getWeapon()].shoot,
            new createjs.PlayPropsConfig().set({ volume: volume, pan: pan }),
          );
        }
        break;
      case "reload":
        if (playerClass.getCurrentStatusFrame() == 0) {
          createjs.Sound.play(
            this.weaponSounds[playerClass.getWeapon()].reload,
            new createjs.PlayPropsConfig().set({ volume: volume, pan: pan }),
          );
        }
        break;
    }
  }

  frame(players, graphicsClass) {
    if (players) {
      for (let i = 0; i < players.length; i++) {
        const player = players[players[i]];
        if (player) {
          if (!player.isOtherPlayer()) {
            if (player.getSpeedX() !== 0 || player.getSpeedY() !== 0) {
              const now = performance.now();
              if (
                now - this.lastStepPlayedTime >
                (player.isPlayerRunning() ? 300 : 400)
              ) {
                this.lastStepPlayedTime = now;
                if (!this.muted) {
                  createjs.Sound.play(
                    this.stepSounds[this.playedStepIndex++ % 2],
                    new createjs.PlayPropsConfig().set({ volume: 0.1 }),
                  );
                }
              }
            } else {
              this.playedStepIndex = 0;
              this.lastStepPlayedTime = 0;
            }
          }
        }
      }
    }
  }
}

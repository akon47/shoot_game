class SoundEffect {
    constructor(src, bufferCount) {
        this.sounds = [];
        this.loop = false;
        this.volume = 0.5;
        this.loadedAudios = 0;

        var self = this;
        for(var i = 0; i < (bufferCount ? bufferCount : 20); i++) {
            var audio = new Audio();
            this.sounds.push(audio);

            audio.addEventListener("canplaythrough", function () {
                self.loadedAudios++;
            }, false); 
            /*
            audio.addEventListener("ended", function () {
                if (window.chrome) audio.load();
                audio.pause();
            }, false);
            */
            audio.src = src;
            audio.loop = this.loop;
            audio.volume = this.volume;
            audio.load();
            //document.body.appendChild(audio);
        }
    }

    isLoaded() {
        return (this.loadedAudios >= this.sounds.length);
    }

    play() {
        for(var i = 0; i < this.sounds.length; i++) {
            if(this.sounds[i].paused || this.sounds[i].ended) {
                this.sounds[i].play();
                console.log(this.sounds[i].src + ' -> play');
                break;
            }
        }
    }

    setVolume(volume) {
        this.volume = volume;
        for(var i = 0; i < this.sounds.length; i++) {
            this.sounds[i].volume = volume;
        }
    }

    setLoop(loop) {
        this.loop = loop
        for(var i = 0; i < this.sounds.length; i++) {
            this.sounds[i].loop = loop;
        }
    }

    setMuted(muted) {
        this.muted = muted
        for(var i = 0; i < this.sounds.length; i++) {
            this.sounds[i].muted = muted;
        }
    }
}

class SoundClass {
    constructor() {        
        var self = this;

        /*
        this.stepSounds = [];
        this.playedStepIndex = 0;
        this.lastStepPlayedTime = 0;
        this.stepSounds.push(new SoundEffect('sound/step_1.mp3', 3));
        this.stepSounds.push(new SoundEffect('sound/step_2.mp3', 3));

        this.weaponSounds = ['handgun', 'rifle', 'shotgun'];
        this.weaponSounds['handgun'] = [];
        this.weaponSounds['handgun'].shoot = new SoundEffect('sound/handgun_shoot.mp3');
        this.weaponSounds['handgun'].reload = new SoundEffect('sound/handgun_reload.mp3', 1);

        this.weaponSounds['rifle'] = [];
        this.weaponSounds['rifle'].shoot = new SoundEffect('sound/rifle_shoot.mp3');
        this.weaponSounds['rifle'].reload = new SoundEffect('sound/rifle_reload.mp3', 1);

        this.weaponSounds['shotgun'] = [];
        this.weaponSounds['shotgun'].shoot = new SoundEffect('sound/shotgun_shoot.mp3');
        this.weaponSounds['shotgun'].reload = new SoundEffect('sound/shotgun_reload.mp3', 1);

        this.bgm = new Audio();
        this.bgm.src = 'sound/Heresy.mp3';
        this.bgm.loop = true;
        this.bgm.volume = 0.3;
        this.bgm.addEventListener("canplaythrough", function () {
            self.bgm.play();
        }, false); 
        this.bgm.load();
        */
        this.muted = false;

        this.stepSounds = [];
        this.playedStepIndex = 0;
        this.lastStepPlayedTime = 0;
        this.stepSounds.push('sound/step_1.mp3');
        this.stepSounds.push('sound/step_2.mp3');

        this.weaponSounds = ['handgun', 'rifle', 'shotgun'];
        this.weaponSounds['handgun'] = [];
        this.weaponSounds['handgun'].shoot = ('sound/handgun_shoot.mp3');
        this.weaponSounds['handgun'].reload = ('sound/handgun_reload.mp3');

        this.weaponSounds['rifle'] = [];
        this.weaponSounds['rifle'].shoot = ('sound/rifle_shoot.mp3');
        this.weaponSounds['rifle'].reload = ('sound/rifle_reload.mp3');

        this.weaponSounds['shotgun'] = [];
        this.weaponSounds['shotgun'].shoot = ('sound/shotgun_shoot.mp3');
        this.weaponSounds['shotgun'].reload = ('sound/shotgun_reload.mp3');

        //this.bgm = 'sound/Reborn - Main Menu.mp3';
        //this.bgm = 'sound/Denise - Burning Like a Flame.mp3';
        //this.bgm = 'sound/haruka.mp3';
        this.bgm = 'sound/200 Upbeat, Futuristic Area (Loop, 160kbps).mp3';

        this.impactSounds = [];
        this.impactSounds.push('/sound/impact/Impact_Flesh_001.mp3');
        this.impactSounds.push('/sound/impact/Impact_Flesh_002.mp3');
        this.impactSounds.push('/sound/impact/Impact_Flesh_003.mp3');


        this.loadedSounds = 0;
        createjs.Sound.addEventListener("fileload", function(e) {
            console.log('fileload -> ' + e.src);
            if(e.src === self.bgm) {
                createjs.Sound.play(self.bgm, new createjs.PlayPropsConfig().set({interrupt: createjs.Sound.INTERRUPT_ANY, loop: -1, volume: 0.05}));
            }
            self.loadedSounds++;
        });
        createjs.Sound.addEventListener("fileerror", function(e) {
            console.log('fileerror -> ' + e.src);
            self.loadedSounds++;
        });

        createjs.Sound.registerSound(this.bgm, this.bgm);
        for(var i = 0; i < this.stepSounds.length; i++) {
            createjs.Sound.registerSound(this.stepSounds[i], this.stepSounds[i]);
        }
        for(var i = 0; i < this.weaponSounds.length; i++) {
            var weaponSoundInfo = this.weaponSounds[this.weaponSounds[i]];
            if(weaponSoundInfo) {
                if(weaponSoundInfo.shoot) {
                    createjs.Sound.registerSound(weaponSoundInfo.shoot, weaponSoundInfo.shoot);
                }
                if(weaponSoundInfo.reload) {
                    createjs.Sound.registerSound(weaponSoundInfo.reload, weaponSoundInfo.reload);
                }
            }
        }
        for(var i = 0; i < this.impactSounds.length; i++) {
            createjs.Sound.registerSound(this.impactSounds[i], this.impactSounds[i]);
        }
    }

    setMuted(muted) {
        this.muted = muted;
        //this.bgm.muted = muted;
    }

    isMuted() {
        return this.muted;
    }

    toggleMuted(){
        this.muted = !this.muted;
        createjs.Sound.muted = this.muted;
    }

    isLoaded() {
        return (this.loadedSounds === 12);
    }

    getSoundVolumePanByPosition(ear, sound) {
        const earX = ear.x;
        const earY = ear.y;
        const soundX = sound.x;
        const soundY = sound.y;

        const dx = (soundX - earX);
        const dy = (soundY - earY);

        const distance = Math.sqrt((dx * dx) + (dy * dy));

        var volume = 1.0, pan = 0.0;

        volume = Math.max(0, (1.0 - (distance / 1500)));

        if (volume > 0) {
            const soundAngle = Math.atan2(soundY - earY, soundX - earX);

            if (soundAngle >= -Math.PI && soundAngle < -(Math.PI / 2)) { // lefttop
                pan = (soundAngle / (Math.PI / 2)) + 1;
            } else if (soundAngle > -(Math.PI / 2) && soundAngle <= 0) { // righttop
                pan = (soundAngle / (Math.PI / 2)) + 1;
            } else if (soundAngle >= 0 && soundAngle < (Math.PI / 2)) { // rightbottom
                pan = 1 - (soundAngle / (Math.PI / 2));
            } else if (soundAngle > (Math.PI / 2) && soundAngle <= (Math.PI)) { // leftbottom
                pan = 1 - (soundAngle / (Math.PI / 2));
            }
        }

        return { volume: volume, pan: pan };
    }

    playImpactSound(volume, pan) {
        if(this.muted) {
            return;
        }

        volume = volume ? volume : 1.0;
        pan = pan ? pan : 0;

        createjs.Sound.play(this.impactSounds[Math.floor(Math.random() * this.impactSounds.length)], new createjs.PlayPropsConfig().set({volume: volume, pan: pan}));
    }

    playWeaponSound(playerClass, volume, pan) {
        if(this.muted) {
            return;
        }

        volume = volume ? volume : 0.5;
        pan = pan ? pan : 0;

        switch(playerClass.getStatus()) {
            case 'shoot':
                if(playerClass.getCurrentStatusFrame() == 0) {
                    //this.weaponSounds[playerClass.getWeapon()].shoot.play();
                    createjs.Sound.play(this.weaponSounds[playerClass.getWeapon()].shoot, new createjs.PlayPropsConfig().set({volume: volume, pan: pan}));
                }
                break;
            case 'reload':
                if(playerClass.getCurrentStatusFrame() == 0) {
                    //this.weaponSounds[playerClass.getWeapon()].reload.play();
                    createjs.Sound.play(this.weaponSounds[playerClass.getWeapon()].reload, new createjs.PlayPropsConfig().set({volume: volume, pan: pan}));
                }
                break;
        }
    }

    frame(players, graphicsClass) {

        // if(this.bgm && this.bgm.paused) {
        //     this.bgm.play();
        // }

        if(players) {
            for(var i = 0; i < players.length; i++) {
                const player = players[players[i]];
                if(player) {
                    if(!player.isOtherPlayer()) {
                        if(player.getSpeedX() !== 0 || player.getSpeedY() !== 0) {
                            var now = performance.now();
                            if(now - this.lastStepPlayedTime > 300) {
                                this.lastStepPlayedTime = now;
                                if(!this.muted) {
                                    //this.stepSounds[(this.playedStepIndex++) % 2].play();
                                    createjs.Sound.play(this.stepSounds[(this.playedStepIndex++) % 2]);
                                }
                            }
                        }
                        else {
                            this.playedStepIndex = 0;
                            this.lastStepPlayedTime = 0;
                        }
                    }
                }
            }
        }
    }
}
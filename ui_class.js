class UserInterfaceClass {
  constructor(canvas) {
    this.canvas = canvas;
    this.screenWidth = canvas.width;
    this.screenHeight = canvas.height;
    this.drawingContext = canvas.getContext("2d");

    this.minimapInterfaceClass = new MinimapInterfaceClass(200);
    this.minimapInterfaceClass.setPosition(
      this.screenWidth - this.minimapInterfaceClass.getWidth() - 5,
      5
    );

    this.userHUD = new UserHUD(this.screenWidth, this.screenHeight);
    this.infoHUD = new InfoHUD(this.screenWidth, this.screenHeight);
    this.infoHUDVisible = false;

    this.killHUD = new KillHUD(this.screenWidth, this.screenHeight);
  }

  update(mapClass, players) {
    this.drawingContext.clearRect(0, 0, this.screenWidth, this.screenHeight);
    /*
    if (debugClass.debugGraphicsVisible) {
      this.minimapInterfaceClass.drawUserInterface(
        this.drawingContext,
        mapClass,
        players
      );
    }
    */
    this.userHUD.drawHUD(this.drawingContext, players);
    this.killHUD.drawHUD(this.drawingContext);
    if (this.infoHUDVisible) {
      this.infoHUD.drawHUD(this.drawingContext, players);
    }

    this.drawingContext.font = "15px Arial";
    this.drawingContext.textBaseline = "top";
    this.drawingContext.textAlign = "center";
    this.drawingContext.fillStyle = "white";

    
    this.drawingContext.fillText(`${players.filter((elem) => players[elem]).length} players are online`, this.screenWidth / 2, 10);

    if (debugClass) {
      debugClass.drawDebugInfo(this.drawingContext);
    }
  }

  isLoaded() {
    return this.userHUD.isLoaded();
  }

  showInfoHUD() {
    this.infoHUDVisible = true;
  }

  hideInfoHUD() {
    this.infoHUDVisible = false;
  }

  writeDieMessage(player, providerPlayer, reason) {
    this.killHUD.addKillLog(player, providerPlayer, reason);
  }
}

class InfoHUD {
  constructor(screenWidth, screenHeight) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.infoBoxWidth = screenWidth * 0.5;
    this.infoBoxHeight = screenHeight * 0.5;
    this.infoBox = {
      left: (screenWidth - this.infoBoxWidth) / 2,
      top: (screenHeight - this.infoBoxHeight) / 2,
      right: screenWidth - (screenWidth - this.infoBoxWidth) / 2,
      bottom: screenHeight - (screenHeight - this.infoBoxHeight) / 2,
      width: this.infoBoxWidth,
      height: this.infoBoxHeight,
    };
  }

  drawHUD(drawingContext, players) {
    drawingContext.beginPath();
    drawingContext.rect(
      this.infoBox.left,
      this.infoBox.top,
      this.infoBox.width,
      this.infoBox.height
    );
    drawingContext.fillStyle = "rgba(70, 70, 70, 0.8)";
    drawingContext.fill();

    drawingContext.font = "bold 20px Arial";
    drawingContext.textBaseline = "top";
    drawingContext.textAlign = "center";
    drawingContext.fillStyle = "white";

    let y = 0;
    for (let i = 0; i < players.length; i++) {
      const player = players[players[i]];
      if (player) {
        drawingContext.fillText(
          player.getPlayerDescription() +
            ", Kill: " +
            player.getKill() +
            ", Death: " +
            player.getDeath(),
          this.infoBox.left + this.infoBox.width / 2,
          this.infoBox.top + y * 23 + 20
        );
        y++;
      }
    }
  }
}

class UserHUD {
  constructor(screenWidth, screenHeight) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.images = [];

    var self = this;
    // this.images['flashlight'] = [];
    // this.images['flashlight'].image = new Image();
    // this.images['flashlight'].image.src = 'images/weapons/flashlight.png';
    // this.images['flashlight'].isLoaded = false;
    // this.images['flashlight'].image.onload = function() {
    //     self.images['flashlight'].isLoaded = true;
    // };

    this.images["knife"] = [];
    this.images["knife"].image = new Image();
    this.images["knife"].image.src = "images/weapons/knife.png";
    this.images["knife"].isLoaded = false;
    this.images["knife"].image.onload = function () {
      self.images["knife"].isLoaded = true;
    };

    this.images["handgun"] = [];
    this.images["handgun"].image = new Image();
    this.images["handgun"].image.src = "images/weapons/handgun.png";
    this.images["handgun"].isLoaded = false;
    this.images["handgun"].image.onload = function () {
      self.images["handgun"].isLoaded = true;
    };

    this.images["rifle"] = [];
    this.images["rifle"].image = new Image();
    this.images["rifle"].image.src = "images/weapons/rifle.png";
    this.images["rifle"].isLoaded = false;
    this.images["rifle"].image.onload = function () {
      self.images["rifle"].isLoaded = true;
    };

    this.images["shotgun"] = [];
    this.images["shotgun"].image = new Image();
    this.images["shotgun"].image.src = "images/weapons/shotgun.png";
    this.images["shotgun"].isLoaded = false;
    this.images["shotgun"].image.onload = function () {
      self.images["shotgun"].isLoaded = true;
    };
  }

  isLoaded() {
    return (
      this.images["handgun"].isLoaded &&
      this.images["rifle"].isLoaded &&
      this.images["shotgun"].isLoaded
    );
  }

  drawHUD(drawingContext, players) {
    for (let i = 0; i < players.length; i++) {
      const player = players[players[i]];
      if (player && !player.isOtherPlayer()) {
        const image = this.images[player.getWeapon()];
        let imageHeight = 0;
        if (image && image.isLoaded) {
          drawingContext.drawImage(
            image.image,
            this.screenWidth - image.image.width,
            this.screenHeight - image.image.height
          );
          imageHeight = image.image.height;
        }

        drawingContext.font = "bold 30px Arial";
        drawingContext.textBaseline = "bottom";
        drawingContext.textAlign = "right";
        drawingContext.fillStyle = "white";

        if (player.getWeapon() === "knife") {
          drawingContext.fillText(
            "∞",
            this.screenWidth - 10,
            this.screenHeight - image.image.height
          );
        } else {
          const ammoInfo = player.getCurrentAmmoInfo();
          if (ammoInfo) {
            drawingContext.fillText(
              ammoInfo.currentAmmo + " / " + ammoInfo.maxAmmo,
              this.screenWidth - 10,
              this.screenHeight - image.image.height
            );
          }
        }

        drawingContext.fillText(
          player.getHp() + " +",
          this.screenWidth - 10,
          this.screenHeight - imageHeight - 30 - 5
        );

        drawingContext.fillText(
          player.getPlayerDescription(),
          this.screenWidth - 10,
          this.screenHeight - imageHeight - 30 - 30 - 5 - 5
        );
        break;
      }
    }
  }
}

class MinimapInterfaceClass {
  constructor(size, x, y) {
    this.minimapSize = size !== undefined ? 200 : 0;
    this.x = x !== undefined ? x : 0;
    this.y = y !== undefined ? y : 0;
    this.visible = true;
  }

  setVisible(visible) {
    this.visible = visible;
  }

  isVisible() {
    if (this.visible !== undefined) {
      return this.visible;
    } else {
      return false;
    }
  }

  toggleVisible() {
    this.setVisible(!this.isVisible());
  }

  getX() {
    return this.x;
  }

  getY() {
    return this.y;
  }

  setX(x) {
    this.x = x;
  }

  setY(y) {
    this.y = y;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  getWidth() {
    return this.minimapSize;
  }

  getHeight() {
    return this.minimapSize;
  }

  drawUserInterface(drawingContext, mapClass, players) {
    if (this.isVisible()) {
      drawingContext.beginPath();
      drawingContext.fillStyle = "#313131C0";
      //drawingContext.roundedRect(this.x, this.y, this.minimapSize, this.minimapSize + 28, 5);
      drawingContext.roundedRect(
        this.x,
        this.y,
        this.minimapSize,
        this.minimapSize,
        5
      );
      drawingContext.fill();

      drawingContext.beginPath();
      drawingContext.strokeStyle = "#FFFFFFFF";
      drawingContext.lineWidth = 1;
      drawingContext.rect(
        this.x + 10,
        this.y + 10,
        this.minimapSize - 20,
        this.minimapSize - 20
      );
      drawingContext.stroke();
      drawingContext.fill();
      drawingContext.strokeStyle = "#00000000";

      var minimapInnerSize = this.minimapSize - 20;

      var worldWidth = mapClass.getPixelWidth();
      var worldHeight = mapClass.getPixelHeight();

      const fontHeightPixel = 14;
      drawingContext.font = "normal " + fontHeightPixel + "px MapoPeacefull";
      drawingContext.textBaseline = "top";
      drawingContext.textAlign = "right";

      for (let i = 0; i < players.length; i++) {
        const player = players[players[i]];
        if (player) {
          drawingContext.beginPath();
          drawingContext.fillStyle = player.isOtherPlayer() ? "blue" : "red";
          const dotX = (player.getCenterX() / worldWidth) * minimapInnerSize;
          const dotY = (player.getCenterY() / worldHeight) * minimapInnerSize;
          drawingContext.rect(this.x + dotX + 10, this.y + dotY + 10, 3, 3);
          drawingContext.fill();
        }
      }
    }
  }
}

class KillHUD {
  constructor(screenWidth, screenHeight) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.messages = [];

    this.hudBoxWidth = screenWidth * 0.2;
    this.hudBoxHeight = screenHeight * 0.5;
    const left = this.screenWidth - this.hudBoxWidth - 10;
    const top = 10;
    this.hudBox = {
      left: left,
      top: top,
      right: left + this.hudBoxWidth,
      bottom: top + this.hudBoxHeight,
      width: this.hudBoxWidth,
      height: this.hudBoxHeight,
    };

    // this.images = [];
    // this.images["knife"] = [];
    // this.images["knife"].image = new Image();
    // this.images["knife"].image.src = "images/weapons/knife.png";
    // this.images["knife"].isLoaded = false;
    // this.images["knife"].image.onload = function () {
    //   self.images["knife"].isLoaded = true;
    // };

    // this.images["handgun"] = [];
    // this.images["handgun"].image = new Image();
    // this.images["handgun"].image.src = "images/weapons/handgun.png";
    // this.images["handgun"].isLoaded = false;
    // this.images["handgun"].image.onload = function () {
    //   self.images["handgun"].isLoaded = true;
    // };

    // this.images["rifle"] = [];
    // this.images["rifle"].image = new Image();
    // this.images["rifle"].image.src = "images/weapons/rifle.png";
    // this.images["rifle"].isLoaded = false;
    // this.images["rifle"].image.onload = function () {
    //   self.images["rifle"].isLoaded = true;
    // };
  }

  drawHUD(drawingContext) {
    const nowTicks = Date.now();
    drawingContext.textBaseline = "top";
    drawingContext.textAlign = "right";
    drawingContext.fillStyle = "white";

    let y = 0;
    for (let i = 0; i < this.messages.length; i++) {
      if (this.messages[i].expire > nowTicks) {
        const player = this.messages[i].player;
        const providerPlayer = this.messages[i].providerPlayer;
        const reason = this.messages[i].reason;

        drawingContext.font = "bold 15px Arial";
        drawingContext.fillStyle = "red";
        drawingContext.fillText(
          "KILL",
          this.hudBox.right,
          this.hudBox.top + y * 25
        );
        drawingContext.font = "15px Arial";
        drawingContext.fillStyle = "white";
        drawingContext.fillText(
          `[${providerPlayer.getPlayerDescription()}] -> [${player.getPlayerDescription()}]`,
          this.hudBox.right - 40,
          this.hudBox.top + y * 25
        );

        // const image = this.images[reason.weapon];
        // drawingContext.drawImage(
        //   image.image,
        //   this.hudBox.right - 50,
        //   this.hudBox.top + y * 15
        // );

        y++;
      }
    }
  }

  addKillLog(player, providerPlayer, reason) {
    let providerName = "";
    switch (reason.provider) {
      case "user":
      case "ai":
        providerName = providerPlayer.getPlayerDescription();
        break;
    }

    this.messages.push({
      player: player,
      providerPlayer: providerPlayer,
      reason: reason,
      expire: Date.now() + 10000,
    });
  }
}

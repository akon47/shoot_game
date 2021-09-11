const KEYCODE_TAB = 9;
const KEYCODE_RETURN = 13;
const KEYCODE_LEFT_ARROW = 37;
const KEYCODE_UP_ARROW = 38;
const KEYCODE_RIGHT_ARROW = 39;
const KEYCODE_DOWN_ARROW = 40;

const KEYCODE_M = 77;

const KEYCODE_F1 = 112;
const KEYCODE_F2 = 113;
const KEYCODE_F3 = 114;
const KEYCODE_F4 = 115;
const KEYCODE_F5 = 116;
const KEYCODE_F6 = 117;
const KEYCODE_F7 = 118;
const KEYCODE_F8 = 119;
const KEYCODE_F9 = 120;

const KEYCODE_A = 65;
const KEYCODE_W = 87;
const KEYCODE_S = 83;
const KEYCODE_D = 68;

const KEYCODE_SPACE = 32;

const KEYCODE_PAGEUP = 33;
const KEYCODE_PAGEDOWN = 34;

const KEYCODE_0 = 48;
const KEYCODE_1 = 49;
const KEYCODE_2 = 50;
const KEYCODE_3 = 51;
const KEYCODE_4 = 52;
const KEYCODE_5 = 53;
const KEYCODE_6 = 54;
const KEYCODE_7 = 55;
const KEYCODE_8 = 56;
const KEYCODE_9 = 57;

const KEYCODE_E = 69;
const KEYCODE_F = 70;
const KEYCODE_R = 82;

const KEYCODE_TILDE = 192;

const KEYCODE_SHIFT = 16;

const MOUSE_LEFT_BUTTON = 0;
const MOUSE_MIDDLE_BUTTON = 1;
const MOUSE_RIGHT_BUTTON = 2;

class InputClass {
  constructor(window, canvas) {
    this.canvas = canvas;
    this.cursorX = 0;
    this.cursorY = 0;
    this.leftButtonDown = false;
    this.middleButtonDown = false;
    this.rightButtonDown = false;
    this.isKeyStatus = [];

    var self = this;
    window.onkeydown = function (e) {
      if (!self.isKeyStatus[e.keyCode]) {
        self.isKeyStatus[e.keyCode] = [];
      }

      if (!self.isKeyStatus[e.keyCode].isPressed) {
        self.isKeyStatus[e.keyCode].isPressed = true;
        if (self.onkeydown) {
          if (self.onkeydown(e.keyCode)) {
            e.preventDefault();
          }
          console.log("KeyDown -> Code: " + e.keyCode);
        }
      }
    };

    window.onkeyup = function (e) {
      if (!self.isKeyStatus[e.keyCode]) {
        self.isKeyStatus[e.keyCode] = [];
      }
      if (self.isKeyStatus[e.keyCode].isPressed) {
        self.isKeyStatus[e.keyCode].isPressed = false;
        if (self.onkeyup) {
          self.onkeyup(e.keyCode);
        }
      }
    };

    window.onmousemove = function (e) {
      var x = e.clientX - self.canvas.offsetLeft;
      var y = e.clientY - self.canvas.offsetTop;
      if (
        x >= 0 &&
        y >= 0 &&
        x <= self.canvas.offsetWidth &&
        y <= self.canvas.offsetHeight
      ) {
        self.cursorX = x;
        self.cursorY = y;
        self.cursorX *= self.canvas.width / self.canvas.offsetWidth;
        self.cursorY *= self.canvas.height / self.canvas.offsetHeight;

        if (self.onmousemove) {
          if (
            self.onmousemove(
              self.cursorX,
              self.cursorY,
              e.movementX,
              e.movementY
            )
          ) {
            e.preventDefault();
          }
        }
      }
    };

    window.onmousedown = function (e) {
      var x = e.clientX - self.canvas.offsetLeft;
      var y = e.clientY - self.canvas.offsetTop;
      if (
        x >= 0 &&
        y >= 0 &&
        x <= self.canvas.offsetWidth &&
        y <= self.canvas.offsetHeight
      ) {
        self.cursorX = x;
        self.cursorY = y;
        self.cursorX *= self.canvas.width / self.canvas.offsetWidth;
        self.cursorY *= self.canvas.height / self.canvas.offsetHeight;

        switch (e.button) {
          case 0:
            self.leftButtonDown = true;
            break;
          case 1:
            self.middleButtonDown = true;
            break;
          case 2:
            self.rightButtonDown = true;
            break;
        }
        if (self.onmousedown) {
          if (self.onmousedown(e.button)) {
            e.preventDefault();
          }
        }
      }
    };

    window.onmouseup = function (e) {
      var x = e.clientX - self.canvas.offsetLeft;
      var y = e.clientY - self.canvas.offsetTop;
      if (
        x >= 0 &&
        y >= 0 &&
        x <= self.canvas.offsetWidth &&
        y <= self.canvas.offsetHeight
      ) {
        self.cursorX = x;
        self.cursorY = y;
        self.cursorX *= self.canvas.width / self.canvas.offsetWidth;
        self.cursorY *= self.canvas.height / self.canvas.offsetHeight;

        switch (e.button) {
          case 0:
            self.leftButtonDown = false;
            break;
          case 1:
            self.middleButtonDown = false;
            break;
          case 2:
            self.rightButtonDown = false;
            break;
        }
        if (self.onmouseup) {
          self.onmouseup(e.button);
        }
      }
    };

    document.body.addEventListener(
      "touchstart",
      function (e) {
        //e.preventDefault();
      },
      false
    );

    document.body.addEventListener(
      "touchmove",
      function (e) {
        var x = e.touches[0].clientX - self.canvas.offsetLeft;
        var y = e.touches[0].clientY - self.canvas.offsetTop;
        if (
          x >= 0 &&
          y >= 0 &&
          x <= self.canvas.offsetWidth &&
          y <= self.canvas.offsetHeight
        ) {
          self.cursorX = x;
          self.cursorY = y;
          self.cursorX *= self.canvas.width / self.canvas.offsetWidth;
          self.cursorY *= self.canvas.height / self.canvas.offsetHeight;

          if (self.onmousemove) {
            self.onmousemove(self.cursorX, self.cursorY);
          }
        }
        e.preventDefault();
      },
      false
    );
  }

  isKeyDown(keyCode) {
    if (this.isKeyStatus[keyCode]) {
      return this.isKeyStatus[keyCode].isPressed;
    } else {
      return false;
    }
  }

  isMouseLeftButtonDown() {
    return this.leftButtonDown;
  }

  isMouseRightButtonDown() {
    return this.rightButtonDown;
  }

  getCursorX() {
    return this.cursorX;
  }

  getCursorY() {
    return this.cursorY;
  }
}

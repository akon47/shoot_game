const heads = document.getElementsByTagName("head");
if (heads && heads.length > 0) {
  const requireScripts = [
    "system_class.js",
    "extension_method.js",
    "input_class.js",
    "chat_class.js",
    "lighting_class.js",
    "ui_class.js",
    "graphics_class.js",
    "map_class.js",
    "map_office.js",
    "map_arena.js",
    "map_ruins.js",
    "map_registry.js",
    "particle_class.js",
    "object_class.js",
    "item_class.js",
    "sprite_class.js",
    "camera_class.js",
    "sound_class.js",
    "player_class.js",
    "weather_class.js",
    "network_class.js",
    "locale_class.js",
    "debug_class.js",
  ];

  for (let i = 0; i < requireScripts.length; i++) {
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", requireScripts[i]);
    // 동적 삽입 스크립트는 기본이 async 라 실행 순서가 보장되지 않는다.
    // map_registry.js 처럼 앞 스크립트의 전역을 참조하는 파일이 있으므로 순서를 고정한다.
    script.async = false;
    heads[0].appendChild(script);
  }
}

let systemClass;

window.onload = function () {
  $("html, body").css({
    height: "100%",
    width: "100%",
    margin: "0px",
    padding: "0px",
    background: "#313131",
  });

  const frameworkRootDiv = this.document.getElementById("framework_root");
  frameworkRootDiv.style.position = "relative";
  frameworkRootDiv.style.width = "100%";
  frameworkRootDiv.style.height = "100%";

  if (frameworkRootDiv) {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;

    //canvas.style.zIndex = 1;
    canvas.style.border = "0px solid black";
    canvas.style.position = "absolute";
    canvas.style.maxWidth = "100%";
    canvas.style.maxHeight = "100%";
    canvas.style.width = "auto";
    canvas.style.height = "auto";
    canvas.style.margin = "auto";
    canvas.style.top = "0";
    canvas.style.bottom = "0";
    canvas.style.left = "0";
    canvas.style.right = "0";

    canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    document.addEventListener("keydown", (e) => {
      switch (e.keyCode) {
        case KEYCODE_TAB:
        case KEYCODE_F5:
        case KEYCODE_F12:
          e.preventDefault();
          break;
      }
    });

    canvas.requestPointerLock =
      canvas.requestPointerLock || canvas.mozRequestPointerLock;
    document.exitPointerLock =
      document.exitPointerLock || document.mozExitPointerLock;

    const lightingCanvas = canvas.cloneNode(false);
    lightingCanvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    const uiCanvas = canvas.cloneNode(false);
    uiCanvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    if (canvas.getContext) {
      frameworkRootDiv.appendChild(canvas);
      frameworkRootDiv.appendChild(uiCanvas);

      systemClass = new SystemClass(window, frameworkRootDiv, canvas, uiCanvas);
      systemClass.run();
    } else {
      // error
    }
  }
};

function setCookie(name, value, exp) {
  if (exp === undefined) {
    exp = 365;
  }
  var date = new Date();
  date.setTime(date.getTime() + exp * 24 * 60 * 60 * 1000);
  document.cookie =
    name + "=" + value + ";expires=" + date.toUTCString() + ";path=/";
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCookie(name) {
  var value = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return value ? value[2] : null;
}

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

class ChatClass {
    constructor(window, rootElement, canvas) {
        this.rootElement = rootElement;
        this.canvas = canvas;

        this.chatRootElement = document.createElement('div');
        this.chatRootElement.style.position = 'absolute';
        this.chatRootElement.style.background = '#313131A0';
        this.chatRootElement.style.width = Math.floor(canvas.offsetWidth * 0.3) + 'px';
        this.chatRootElement.style.height = Math.floor(canvas.offsetHeight * 0.3) + 'px';
        this.chatRootElement.style.padding = '0px';
        this.chatRootElement.style.margin = '0px';
        this.chatRootElement.style.display = 'flex';
        this.chatRootElement.style.flexDirection = 'column';

        this.messageElement = document.createElement('div');
        this.messageElement.setAttribute('id', 'messageArea');
        this.messageElement.style.position = 'relative';
        this.messageElement.style.background = '#00000000';
        this.messageElement.style.flex = '1';
        this.messageElement.style.margin = '2% 2% 0% 2%';
        this.messageElement.style.fontSize = '12px';
        this.messageElement.style.fontWeight = 'normal';
        this.messageElement.style.color = 'white';
        this.messageElement.style.resize = 'none';
        this.messageElement.style.overflowY = 'scroll';
        this.messageElement.style.overflow = 'auto';
        this.messageElement.style.padding = '5px';

        this.chatRootElement.appendChild(this.messageElement);

        this.chatElement = document.createElement('input');
        this.chatElement.setAttribute('type', 'text');
        this.chatElement.style.position = 'relative';
        this.chatElement.style.background = '#000000A0';
        this.chatElement.style.width = 'calc(96% - 10px)';
        this.chatElement.style.height = 'Auto';
        this.chatElement.style.flex = '0';
        this.chatElement.style.margin = '2% 0% 2% 2%';
        this.chatElement.style.border = '0 none black';
        this.chatElement.style.color = 'white';
        this.chatElement.style.fontSize = '12px';
        this.chatElement.style.paddingLeft = '5px';
        this.chatElement.style.paddingRight = '5px';

        this.chatRootElement.appendChild(this.chatElement);

        rootElement.appendChild(this.chatRootElement);

        var self = this;
        this.chatElement.addEventListener('blur', e => {
            self.chatElement.value = "";
        });

        window.addEventListener('keydown', e => {
            switch (e.keyCode) {
                case KEYCODE_RETURN:
                    if (self.chatElement === document.activeElement) {
                        if (self.chatElement.value && self.chatElement.value.length > 0) {
                            if (self.chat) {
                                self.chat(self.chatElement.value);
                            }
                        }
                        self.chatElement.value = "";
                        self.chatElement.blur();
                    } else {
                        self.chatElement.focus();
                    }
                    break;
            }
        }, false);

        window.onresize = function () {
            self.updateSize();
        }
        window.onorientationchange = function () {
            self.updateSize();
        }
        this.updateSize();

        this.setVisible(false);
    }

    setVisible(visible) {
        const value = (visible ? 'visible' : 'hidden');
        if (this.chatRootElement.style.visibility !== value) {
            this.chatRootElement.style.visibility = value;
        }
    }

    isInputActive() {
        return (this.chatElement === document.activeElement);
    }

    writeToMessage(text) {
        this.messageElement.innerHTML += text;
        this.messageElement.scrollTop = this.messageElement.scrollHeight;
    }

    updateSize() {
        var chatWidth = 400;
        var chatHeight = 200;
        var margin = 5;

        var scaleWidth = (this.canvas.offsetWidth / this.canvas.width);
        var scaleHeight = (this.canvas.offsetHeight / this.canvas.height);

        chatWidth *= scaleWidth;
        chatHeight *= scaleHeight;

        this.chatRootElement.style.width = chatWidth + 'px';
        this.chatRootElement.style.height = chatHeight + 'px';
        this.chatRootElement.style.left = (this.canvas.offsetLeft + (margin * scaleWidth)) + 'px';
        this.chatRootElement.style.top = (this.canvas.offsetTop + this.canvas.offsetHeight - chatHeight - (margin * scaleHeight)) + 'px';
    }
}
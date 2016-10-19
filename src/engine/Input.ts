 let Input = {
    keyCodes: new Uint8ClampedArray(255),
    keys: <any>{
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,

        SPACE: 32
    },

    kdListeners: <Array<Function>>[],
    mmListeners: <Array<Function>>[],
    mdListeners: <Array<Function>>[],

    init: function (canvas: HTMLCanvasElement) {
        document.body.onkeydown = (event: KeyboardEvent) => {
            this.keyCodes[event.keyCode] = 1;

            for (let i = 0, kd: Function; kd = this.kdListeners[i]; i++) {
                kd(event.keyCode, 1);
            }
        };

        document.body.onkeyup = (event: KeyboardEvent) => {
            this.keyCodes[event.keyCode] = 0;

            for (var i = 0, kd: Function; kd = this.kdListeners[i]; i++) {
                kd(event.keyCode, 0);
            }
        };

        canvas.onmousemove = (event: MouseEvent) => {
            let x = event.clientX - canvas.offsetLeft,
                y = event.clientY - canvas.offsetTop;

            for (let i = 0, mm: Function; mm = this.mmListeners[i]; i++) {
                mm(x, y);
            }
        };

        canvas.onmousedown = (event: MouseEvent) => {
            let x = event.clientX - canvas.offsetLeft,
                y = event.clientY - canvas.offsetTop;

            for (let i = 0, md: Function; md = this.mdListeners[i]; i++) {
                md(x, y, 1);
            }
        };

        canvas.onmouseup = (event: MouseEvent) => {
            let x = event.clientX - canvas.offsetLeft,
                y = event.clientY - canvas.offsetTop;

            for (let i = 0, md: Function; md = this.mdListeners[i]; i++) {
                md(x, y, 0);
            }
        };
    },

    clearListeners: function () {
        this.kdListeners = [];
        this.mmListeners = [];
        this.mdListeners = [];
    },

    addKeyDownListener: function (callback: Function) {
        this.kdListeners.push(callback);
    },

    addMouseMoveListener: function (callback: Function) {
        this.mmListeners.push(callback);
    },

    addMouseDownListener: function (callback: Function) {
        this.mdListeners.push(callback);
    }
};

for (let i = 65; i <= 90; i++) {
    Input.keys[String.fromCharCode(i)] = i;
 }

export { Input };
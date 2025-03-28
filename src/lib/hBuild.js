class hBuild {
    inited = false;
    constructor() {
        window.addEventListener("load", () => {
            if (typeof hMain !== "function") {
                throw new Error("hMain is not a function");
            }
            document.body.replaceChildren(hMain());
            this.inited = true;
        });
    }
    createBaseElement = (elementName) => {
        if (typeof elementName !== "string") {
            throw new Error("elementName is not a string");
        }
        const element = document.createElement(elementName);

        element.child = (...children) => {
            for (let child of children) {
                element.appendChild(child);
            }
            return element;
        }
        element.on = (event, callback) => {
            element.addEventListener(event, callback);
            return element;
        }
        return element;
    }
    hP = (text) => {
        if (typeof text !== "string") {
            throw new Error("text is not a string");
        }
        const p = this.createBaseElement("p");
        p.innerText = text;
        return p;
    }
    hButton = (text) => {
        if (typeof text !== "string") {
            throw new Error("text is not a string");
        }
        let button = this.createBaseElement("button");
        button.innerText = text;
        return button;
    }
    hRows = (...cols) => {
        const div = this.createBaseElement("div");
        return div;
    }

    binginghFunc = new Map();
    isRendering = false;
    reactive = (hFunc) => {
        if (this.isRendering) {
            return this.binginghFunc.get(hFunc);
        }
        const obj = {};
        const proxy = new Proxy(obj, {
            set: (target, prop, value) => {
                if (this.isRendering) {
                    return true;
                }
                target[prop] = value;
                if (!this.inited) {
                    return true;
                }
                this.isRendering = true;
                document.body.replaceChildren(hMain());
                console.log('render');
                this.isRendering = false;
                return true;
            }
        });
        this.binginghFunc.set(hFunc, proxy);
        return proxy;
    }
}
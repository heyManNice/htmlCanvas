class hBaseElement {
    children = [];
    events = [];
    innerText = "";
    constructor(elementName) {
        this.tag = elementName;
    }
    child(...children) {
        this.children = children;
        return this;
    }
    on(event, callback) {
        this.events.push({event, callback});
        return this;
    }
}

class hBuild {
    inited = false;
    constructor() {
        window.addEventListener("load", () => {
            if (typeof hMain !== "function") {
                throw new Error("hMain is not a function");
            }
            this.render(hMain());
            this.inited = true;
        });
    }
    diff = (oldRoot, newRoot) => {
        return this.diffRecursion(oldRoot, newRoot, "0");
    }
    diffRecursion = (oldRoot, newRoot, path) => {
        if(!oldRoot.children||!newRoot.children){
            return; 
        }
        if(oldRoot.children.length !== newRoot.children.length){
            return;
        }
        if(oldRoot.innerText!== newRoot.innerText){
            this.diffResult.push({
                path:path.split(" ").map(item=>Number(item)),
                type:"innerText",
                value:newRoot.innerText
            });
        }
        for (let i = 0; i < oldRoot.children.length; i++) {
            this.diffRecursion(oldRoot.children[i], newRoot.children[i], path+" "+i);
        }
    }
    render = (root)=>{
        if(!this.latestRoot){
            this.latestRoot = root;
            document.body.replaceChildren(this.renderRecursion(root));
            return;
        }
        this.diffResult = [];
        this.diff(this.latestRoot, root);
        for (let item of this.diffResult) {
            let element = document.body;
            for (let i = 0; i < item.path.length; i++) {
                element = element.children[item.path[i]];
            }
            element[item.type] = item.value;
        }
        
    }
    renderRecursion(hBaseElement){
        const element = document.createElement(hBaseElement.tag);
        if (hBaseElement.innerText) {
            element.innerText = hBaseElement.innerText; 
        }
        for (let event of hBaseElement.events) {
            element.addEventListener(event.event, event.callback); 
        }
        for (let child of hBaseElement.children) {
            element.appendChild(this.renderRecursion(child));
        }
        return element;
    }
    createBaseElement = (elementName) => {
        if (typeof elementName !== "string") {
            throw new Error("elementName is not a string");
        }
        const element = new hBaseElement(elementName);
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
                this.render(hMain());
                console.log('render');
                this.isRendering = false;
                return true;
            }
        });
        this.binginghFunc.set(hFunc, proxy);
        return proxy;
    }
}
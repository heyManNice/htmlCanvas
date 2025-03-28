class hBuild{
    inited = false;
    constructor(){
        this.reactive = this.reactive.bind(this);
        window.addEventListener("load",()=>{
            if(typeof hMain !== "function"){
                throw new Error("hMain is not a function");
            }
            document.body.replaceChildren(hMain());
            this.inited = true;
        });
    }
    hP(text){
        if(typeof text !== "string"){
            throw new Error("text is not a string");
        }
        let p = document.createElement("p");
        p.innerText = text;
        return p; 
    }
    hButton(text){
        if(typeof text!== "string"){
            throw new Error("text is not a string");
        }
        let button = document.createElement("button");
        button.innerText = text;
        button.on = (event,callback)=>{
            button.addEventListener(event,callback);
            return button; 
        }
        return button;
    }
    hRows(...cols){
        let div = document.createElement("div");

        div.child = (...children)=>{
            for(let child of children){
                div.appendChild(child);
            }
            return div;
        }
        div.on = (event,callback)=>{
            div.addEventListener(event,callback); 
            return div;
        }
        
        return div;
    }
    binginghFunc = new Map();
    isRendering = false;
    reactive(hFunc){
        if(this.isRendering){
            return this.binginghFunc.get(hFunc); 
        }
        const obj = {};
        const that = this;
        const proxy = new Proxy(obj,{
            set(target,prop,value){
                if(that.isRendering){
                    return true;
                }
                target[prop] = value;
                if(!that.inited){
                    return true; 
                }
                that.isRendering = true;
                document.body.replaceChildren(hMain());
                console.log('render');
                
                that.isRendering = false;
                return true;
            }
        });
        this.binginghFunc.set(hFunc,proxy);
        return proxy;
    }
}
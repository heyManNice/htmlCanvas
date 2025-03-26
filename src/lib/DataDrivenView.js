function log(...args){
    console.log(...args);
}

class DataDrivenView {
    #variables = {};
    #functions = {};
    #template = null;

    /**
     * 变量名与之关联的节点
     * @type {{[key:string]:Set<{template:string,node:Node}>}} 
     */
    #bindings = {};

    constructor(){
        window.addEventListener('load',this.#render.bind(this));
    }

    /**
     * 设置数据
     * @param {{[key: string]:any}} data
     */
    setData(data){
        for(const key in data){
            this.#variables[key] = this.#response(key,data[key]);
        }
    }

    /**
     * 设置函数
     * @param {{[key: string]:Function}} func
     */
    setFunc(func){
        for(const key in func){
            this.#functions[key] = func[key]; 
        }  
    }

    /**
     * 创建响应式对象
     * @param {string} varName 变量名
     * @param {any} value
     * @returns {Proxy}
     */
    #response(varName,value){
        const that = this;
        const obj = {value}
        return new Proxy(obj,{
            set(target,key,value){
                target[key] = value;
                that.#renderBinding(varName);
                return true;
            }
        });
    }
    /**
     * 渲染数据关联的节点
     * @param {string} key
     */
    #renderBinding(key){
        const nodes = this.#bindings[key];
        if(!nodes) return;
        // 储存本次循环已经渲染过的节点
        const renderedNodes = new Set();
        for(const item of nodes){
            const template = item.template;
            const node = item.node;
            if(renderedNodes.has(node)) continue;
            renderedNodes.add(node);
            log("[渲染节点]",node.parentElement);
            node.textContent = template.replace(/__[a-zA-Z_$][a-zA-Z0-9_$]*__/g,(matched) => {
                const key = matched.slice(2,-2);
                const variable = this.#variables[key];
                if(!variable) return matched;
                return variable.value;
            });
        }
    }

    /**
     * 渲染整个页面
     * @returns {void}
     */
    #render(){
        if(!this.#template){
            this.#template = document.querySelector('template');
            this.#template.parentNode.removeChild(this.#template);
        }
        const childNodes = this.#template.content.childNodes;
        const fragment = document.createDocumentFragment();
        
        for(let i = 0; i < childNodes.length; i++){
            fragment.appendChild(childNodes[i].cloneNode(true));
        }

        const walker = document.createTreeWalker(fragment,NodeFilter.SHOW_ALL,null,false);

        while(walker.nextNode()){
            const node = walker.currentNode;
            if(node.nodeType === Node.TEXT_NODE){
                this.#parseTextContent(node); 
            }else if(node.nodeType === Node.ELEMENT_NODE){
                this.#parseElementAttribute(node); 
            }
            
        }
        for(const key in this.#variables){
            this.#renderBinding(key);
        }
        const body = document.querySelector('body');
        body.replaceChildren(...fragment.childNodes);
        
        
    }
    /**
     * 解析文字内容,并记录到变量与节点关联bindings
     * @param {Node} node
     */
    #parseTextContent(node){
        const text = node.textContent;
        if(!text.includes('__')) return;
        //记录是否是相同的键，在同一个节点中，相同的键只需要绑定一次
        const addedKeys = new Set();
        node.textContent.replace(/__[a-zA-Z_$][a-zA-Z0-9_$]*__/g,(matched) => {
            const key = matched.slice(2,-2);
            if(addedKeys.has(key)) return;
            addedKeys.add(key);

            if(!this.#bindings[key]){
                this.#bindings[key] = new Set();
            }
            const add = {
                template:text,
                node
            }
            this.#bindings[key].add(add);
        });
    }
    /**
     * 解析元素属性
     * @param {Node} node
     */
    #parseElementAttribute(node){
        const attrs = node.attributes;
        if(!attrs.length) return;
        for(const attr of attrs){
            const {name,value} = attr;
            if(!name.includes('__')) continue;
            const event = name.slice(2);
            
            let func = this.#functions[value];
            if(!func){
                func = new Function(value);
            }

            log("[事件]",event,func);
            
            node.addEventListener(event,()=>{
                func.call(this.#variables);
            });
        }
    }
}

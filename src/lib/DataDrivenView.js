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
        this.#variables = this.#response(data);
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
     * @param {any} value
     * @returns {Proxy}
     */
    #response(obj){
        const that = this;
        return new Proxy(obj,{
            set(target,key,value){
                target[key] = value;
                that.#renderBinding(key);
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
            const splits = this.#parseText(template);
            let text = "";
            for(const split of splits){
                if(split.type === 'text'){
                    text += split.value;
                }else if(split.type === 'variable'){
                    text += split.value;
                }
            }
            node.textContent = text;
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
                this.#addBindings(node); 
            }else if(node.nodeType === Node.ELEMENT_NODE){
                this.#parseElementAttribute(node); 
            }
            
        }
        for(const key in this.#variables){
            this.#renderBinding(key);
        }
        const body = document.querySelector('body');
        body.replaceChildren(...fragment.childNodes);

        //清理script标签，保持整洁
        document.querySelectorAll("script").forEach(script => script.remove());
    }
    /**
     * 将文本解析分段并分析是否是变量以及相关信息并返回
     * @param {string} text
     * @returns {{type:'variable'|'text',key:string|null,value:string}[]}
     */
    #parseText(text){
         if(!text.includes('__')){
            return {type:'text',value:text};
         }
         const arr = text.split("__");
         const result = [];
         for(const item of arr){
            result.push(this.#parseWord(item));
         }
         return result;
    }
    /**
     * 解析一个词的属性
     * @param {string} word
     * @returns {{type:'variable'|'text',key:string|null,value:string}}
     */
    #parseWord(word){
        //如果这个词不只有英文下划线$或者小数点.，则不是变量
        if(!/^[a-zA-Z_.$][a-zA-Z0-9_.$]*$/.test(word)){
            return {type:'text',value:word};  
        }
        if(word.includes('.')){
            try{
                const variables = word.split('.');
                let value = this.#variables;
                for(const key of variables){
                    value = value[key];
                }
                if(value===void 0){
                    return {type:'text',value:word}; 
                }
                return {type:'variable',key:word,value};
            }catch(e){
                return {type:'text',value:word};
            }
        }
        const value = this.#variables[word];
        if(value===void 0){
            return {type:'text',value:word};
        }
        return {type:'variable',key:word,value:value};
    }

    /**
     * 解析文字内容,并记录到变量与节点关联bindings
     * @param {Node} node
     */
    #addBindings(node){
        const text = node.textContent;
        if(!text.includes('__')) return;
        //记录是否是相同的键，在同一个节点中，相同的键只需要绑定一次
        const splits = this.#parseText(text);
        const addedVariables = new Set();
        for(const item of splits){
            if(item.type === 'text') continue;
            const key = item.key;
            if(addedVariables.has(key)) continue;
            addedVariables.add(key);
            if(!this.#bindings[key]){
                this.#bindings[key] = new Set();
            }
            const add = {
                template:text,
                node
            }
            this.#bindings[key].add(add);
        }
    }
    /**
     * 解析元素属性
     * @param {Node} node
     */
    #parseElementAttribute(node){
        const attrs = node.attributes;
        if(!attrs.length) return;
        for(const attr of [...attrs]){
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
            node.removeAttribute(name);
        }
        
    }
}

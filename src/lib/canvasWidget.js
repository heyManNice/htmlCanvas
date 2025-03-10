class Widget{
    parent;
    children=[];
    // 相对父窗口的位置
    x = 0;
    y = 0;
    absoluteX;
    absoluteY;


    width = 10;
    height = 10;

    backgroundColor="#fff";
    name;
    borderColor="#000";
    borderWidth=0;

    //摧毁标记
    destroyed=false;

    mouseState = "leave";
    
    constructor(parent){
        if(parent instanceof Widget ===true && parent.destroyed===true){
            throw new Error(`parent is destroyed`);
        }
        this.parent=parent;
        if(parent){
            parent.children.push(this); 
        }
        app.widgetsCount++;
    }
    _drawBorder(){
        const graphics=app.graphics;
        graphics.strokeStyle=this.borderColor;
        graphics.lineWidth=this.borderWidth;
        graphics.strokeRect(this.absoluteX,this.absoluteY,this.width,this.height);
    }
    _drawBackground(){
        const graphics=app.graphics;
        graphics.fillStyle=this.backgroundColor;
        graphics.fillRect(this.absoluteX,this.absoluteY,this.width,this.height); 
    }
    setPos(x,y){
        this.x=x;
        this.y=y;
        return this; 
    }
    onDraw(){
        
    }
    //摧毁控件
    destroy(){
        for(const child of this.children){
            child.destroy(); 
        }
        this.children=[];
        if(this.parent){
            const index = this.parent.children.indexOf(this);
            if (index !== -1) {
                this.parent.children.splice(index, 1);
            }
        }
        this.parent=null;
        this.destroyed=true;
        app.widgetsCount--;
    }
    _loop(){
        this.absoluteX=this.x+this.parent.absoluteX;
        this.absoluteY=this.y+this.parent.absoluteY;
        for(const child of this.children){
            child._loop(); 
        }
    }
    _draw(){
        const {mouse,graphics}=app;
        if(this.borderWidth>0){
            this._drawBorder(); 
        }
        if(this.backgroundColor){
            this._drawBackground(); 
        }
        this.onDraw(app);
        for(const child of this.children){
            child._draw();
        }
    }
    /**
     * 带冒泡的事件
     * _mouseLDown带冒泡
     * onMouseLDown不带冒泡
     */
    _mouseLDown(){
        for(const child of this.children){
            if(child.isInArea(app.mouse.absoluteX,app.mouse.absoluteY)){
                child._mouseLDown();
                return;
            }
        }
        //当事件传送中断时执行
        if(this.onMouseLDown){
            this.onMouseLDown();
        }
    }
    /**
     * 冒泡事件
     */
    _mouseLUp(){
        for(const child of this.children){
            if(child.isInArea(app.mouse.absoluteX,app.mouse.absoluteY)){
                child._mouseLUp();
                return;
            }
        }
        //当事件传送中断时执行
        if(this.onMouseLUp){
            this.onMouseLUp();
        }
    }
    /**
     * 冒泡事件
     */
    _mouseMove(){
        this.mouseState="moving";
        for(const child of this.children){
            if(child.isInArea(app.mouse.absoluteX,app.mouse.absoluteY)){
                if(child.mouseState!="moving"){
                    child._mouseEnter();
                }
                child._mouseMove();
                return;
            }
        }
        //当事件传送中断时执行
        if(this.onMouseMove){
            this.onMouseMove();
        }
    }
    /**
     * 冒泡事件
     */
    _mouseEnter(){
        this.mouseState="enter";
        app.mouseEnterWidgets.push(this);
        for(const child of this.children){
            if(child.isInArea(app.mouse.absoluteX,app.mouse.absoluteY)){
                child._mouseEnter();
                return;
            }
        }
        //当事件传送中断时执行
        if(this.onMouseEnter){
            this.onMouseEnter();
        }
    }
    /**
     * 冒泡事件
     * 
     * 所有子元素都要检查鼠标是否离开了自己
     */
    _mouseLeave(){
        this.mouseState="leave";
        for(const child of this.children){
            if(child.mouseState==="moving"){
                child._mouseLeave(); 
            }
        }
        if(this.onMouseLeave){
            this.onMouseLeave();
        }
    }
    setSize(width,height){
        this.width=width;
        this.height=height;
        return this; 
    }
    isInArea(x,y){
        return x>this.absoluteX&&x<this.absoluteX+this.width&&y>this.absoluteY&&y<this.absoluteY+this.height;
    }
    drawLine(points,color="#000",lineWidth=1){
        const graphics=app.graphics;
        graphics.strokeStyle=color;
        graphics.lineWidth=lineWidth;
        graphics.beginPath();
        graphics.moveTo(this.absoluteX+points[0][0],this.absoluteY+points[0][1]);
        for(const point of points){
            graphics.lineTo(this.absoluteX+point[0],this.absoluteY+point[1]);
        }
        graphics.stroke();
    }
    drawText(text,x=0,y=0,color="#000",font="12px Arial"){
        const graphics=app.graphics;
        graphics.fillStyle=color;
        graphics.font=font;
        graphics.fillText(text,this.absoluteX+x,this.absoluteY+y);
    }
}

class Application{
    children=[];
    mouse={
        absoluteX:0,
        absoluteY:0
    }

    //用于记录鼠标进入的widget，检测鼠标是否移出了该控件
    mouseEnterWidgets=[];
    widgetsCount=0;
    constructor(element){
        if(!element||element.nodeName !== 'CANVAS'){
            throw new Error(`canvas element is required, but received ${element ? element.nodeName : 'null'}`);
        }
        if(!window.app){
            // 定义app 并且不可重新赋值
            const that=this;
            Object.defineProperty(window, 'app', {
            configurable: false,
            enumerable: true,
            get() {
                return that;
            },
            set() {
                throw new Error("window.app is already defined and cannot be reassigned.");
            }
        });
        }else if(window.app instanceof Application === false){
            throw new Error(`window.app (instance of ${window.app.constructor.name}) is already defined. The Application requires it to implement a singleton pattern. Please avoid using the 'app' variable under the window object.`); 
        }else{
            // 返回存在的单例
            return window.app; 
        }
        this.canvas=element;
        this.graphics=this.canvas.getContext('2d');
        this.ratio = window.devicePixelRatio || 1;
        this.monitor= {
            width:window.innerWidth*this.ratio,
            height:window.innerHeight*this.ratio
        }
        this.canvas.width=this.monitor.width;
        this.canvas.height=this.monitor.height;
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.absoluteX = e.clientX*this.ratio;
            this.mouse.absoluteY = e.clientY*this.ratio;

            for(const child of this.children){
                if(child.isInArea(app.mouse.absoluteX,app.mouse.absoluteY)){
                    child._mouseMove();
                    break;
                } 
            }
        });
        this.canvas.addEventListener('mousedown', (e) => {
            //左键
            if(e.button===0){
                for(const child of this.children){
                    if(child.isInArea(app.mouse.absoluteX,app.mouse.absoluteY)){
                        child._mouseLDown();
                        break;
                    } 
                }
            }
        });
        this.canvas.addEventListener('mouseup', (e) => {
            if(e.button===0){
                for(const child of this.children){
                    if(child.isInArea(app.mouse.absoluteX,app.mouse.absoluteY)){
                        child._mouseLUp();
                        break;
                    } 
                }
            }
        })
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault(); 
        })
    }
}

class Desktop extends Widget{
    absoluteX=0;
    absoluteY=0;
    x=0;
    y=0;
    constructor(app){
        if(!app||app instanceof Application === false){
            throw new Error(`Application is required, but received ${app? app.constructor.name : 'null'}`); 
        }
        super(app);
        this.width = app.monitor.width;
        this.height = app.monitor.height;
        this._loop();
    }

    _loop(){
        app.graphics.clearRect(0, 0, this.width, this.height);
        for(const child of this.children){
            child._loop();
        }
        this._draw();
        for(const child of app.mouseEnterWidgets){
            if(!child.isInArea(app.mouse.absoluteX,app.mouse.absoluteY)){
                child._mouseLeave();
                const index = app.mouseEnterWidgets.indexOf(child);
                if (index!== -1) {
                    app.mouseEnterWidgets.splice(index, 1);
                }
            }
        }
        requestAnimationFrame(()=>{this._loop()});
    }
    _draw(){
        if(this.isShowPerformance){
            this.drawStartTime = performance.now();;
        }
        if(this.borderWidth>0){
            this._drawBorder();
        }
        if(this.backgroundColor){
            this._drawBackground(); 
        }
        this.onDraw();
        for(let i = this.children.length - 1; i >= 0; i--) {
            const child = this.children[i];
            child._draw();
        }
        if(this.isShowPerformance){
            const lastDrawEndTime = this.drawEndTime;
            this.drawEndTime = performance.now();
            const framePerSecond=Math.round(1000/(this.drawEndTime-lastDrawEndTime));
            const frameRenderTime = Math.round((this.drawEndTime - this.drawStartTime)*1000).toString().padStart(3, '0');;
            this.drawText(`${framePerSecond} FPS  ${app.widgetsCount}Widgets  FRT:${frameRenderTime}us`,10,26,"#000","normal 16px Arial");
            this.drawText(`Mouse: (${Math.round(app.mouse.absoluteX)},${Math.round(app.mouse.absoluteY)})  EnterWidgets:${app.mouseEnterWidgets.length}`,10,46,"#000","normal 16px Arial");
            this.drawText(`Desktop: (${this.width},${this.height})`,10,66,"#000","normal 16px Arial")
        }
    }
    
    isShowPerformance = false;
    
    setShowPerformance(enable){
        this.isShowPerformance=enable;
    }

}

class Window extends Widget{
    mouseClientPos={x:0,y:0};
    mouseStatus=void 0;
    mouseStatusChangePos={x:0,y:0};
    borderWidth=1;
    titleBar;
    isMaximize=false;
    constructor(parent){
        super(parent);
        this.moveToTop();
        this.width=800;
        this.height=600;
        this.x=app.monitor.width/2-this.width/2;
        this.y=app.monitor.height/2-this.height/2;
        this.titleBar=new TitleBar(this);
    }
    setTitle(title){
        this.titleBar.title.text=title;
        this.name = title;
        return this;
    }
    _mouseLDown(){
        super._mouseLDown();
        this.moveToTop();
    }
    _drawShadow(){
        const graphics=app.graphics;
        const windows = this.parent.children;
        if(windows.length&&windows[0]==this){
            const topWindow = windows[0];
            graphics.shadowColor="rgba(0,0,0,0.5)";
            graphics.shadowBlur=15; 
        }else{
            graphics.shadowColor="rgba(0,0,0,0.2)";
            graphics.shadowBlur=15;
        }
        graphics.fillRect(this.absoluteX,this.absoluteY,this.width,this.height);
        graphics.shadowColor=null;
        graphics.shadowBlur=0;
    }
    _draw(){
        this._drawShadow();
        super._draw();
    }
    //移动到最顶端
    moveToTop(){
        //找到桌面
        const desktop = app.children[0];
        if(desktop instanceof Desktop === false){
            throw new Error(`当前桌面不存在`);
        }
        const index = desktop.children.indexOf(this);
        if (index !== -1) {
            desktop.children.splice(index, 1);
            desktop.children.unshift(this);
        }
    }
    setSize(width,height){
        super.setSize(width,height);
        this.titleBar.setSize(width,this.titleBar.height);
        return this;
    }
    setMaximize(){
        this.isMaximize=true;
        this.restoreProps = {
            x:this.x,
            y:this.y,
            width:this.width,
            height:this.height
        }
        this.setPos(0,0);
        this.setSize(app.monitor.width,app.monitor.height);
        return this;
    }
    setRestore(){
        this.isMaximize=false;
        if(this.restoreProps){
            this.setPos(this.restoreProps.x,this.restoreProps.y);
            this.setSize(this.restoreProps.width,this.restoreProps.height); 
        }else{
            this.setPos(app.monitor.width/2-this.width/2,app.monitor.height/2-this.height/2);
            this.setSize(800,600);
        }
        return this; 
    }
    _moveWithMouse(){
        const mouse=app.mouse;
        this.x=mouse.absoluteX-this.mouseStatusChangeClientPos.x;
        this.y=mouse.absoluteY-this.mouseStatusChangeClientPos.y;
    }
    _saveMouseClientPos(){
        const {absoluteX,absoluteY} = app.mouse;
        this.mouseStatusChangeClientPos = {x:absoluteX-this.x,y:absoluteY-this.y};
    }
}

class TitleBar extends Widget{
    title={
        text:"",
        color:"#000",
        fontSize:16,
        fontWeight:"normal",
        fontFamily:"Arial",
        margin:{
            left:10,
            right:0,
            top:5,
            bottom:0
        },
    }
    controller;
    buttons={};
    height=30;
    constructor(parent){
        if(!parent||parent instanceof Window === false){
            throw new Error(`Window is required, but received ${parent? parent.constructor.name : 'null'}`); 
        }
        super(parent);
        this.backgroundColor="#ccc";
        //控制器位置
        this.controller=new Widget(this);
        this.controller.backgroundColor=null;
        this.controller.setSize(90,30);

        //三个按钮
        this.buttons.minimize=new Widget(this.controller);
        const minimize = this.buttons.minimize;
        minimize.backgroundColor=null;
        minimize.setSize(30,30).setPos(0,0);
        minimize.onDraw=()=>{
            minimize.drawLine([[10,18],[20,18]]);
        }
        minimize.onMouseEnter=()=>{
            minimize.backgroundColor="#ddd"; 
        }
        minimize.onMouseLeave=()=>{
            minimize.backgroundColor=null; 
        }
        this.buttons.maximize=new Widget(this.controller);
        const maximize = this.buttons.maximize;
        maximize.backgroundColor=null;
        maximize.setSize(30,30).setPos(30,0);
        maximize.onDraw=()=>{
            if(parent.isMaximize){
                maximize.drawLine([[13,10],[20,10],[20,17]]);
                maximize.drawLine([[10,12],[10,20],[18,20],[18,12],[10,12]]);
            }else{
                maximize.drawLine([[10,10],[10,20],[20,20],[20,10],[10,10]]);
            }
        }
        maximize.onMouseEnter=()=>{
            maximize.backgroundColor="#ddd"; 
        }
        maximize.onMouseLeave=()=>{
            maximize.backgroundColor=null; 
        }
        maximize.onMouseLUp=()=>{
            const window = this.parent;
            if(window.isMaximize){
                window.setRestore();
            }else{
                window.setMaximize();
            }
        }
        this.buttons.close=new Widget(this.controller);
        const close = this.buttons.close;
        close.backgroundColor=null;
        close.setSize(30,30).setPos(60,0);
        close.onDraw=()=>{
            close.drawLine([[10,10],[20,20]]);
            close.drawLine([[10,20],[20,10]]);
        }
        close.onMouseEnter=()=>{
            close.backgroundColor="#f00"; 
        }
        close.onMouseLeave=()=>{
            close.backgroundColor=null; 
        }
        close.onMouseLUp=()=>{
            parent.destroy();
        }
    }
    setSize(width,height){
       super.setSize(width,height);
       this.controller.setPos(this.width-90,0);
       return this; 
    }
    _drawTitleText(){
        const graphics=app.graphics;
        const font = `${this.title.fontWeight} ${this.title.fontSize}px ${this.title.fontFamily}`;
        const color = this.title.color;
        const x = this.title.margin.left;
        const y = this.title.margin.top + this.title.fontSize;
        this.drawText(this.title.text,x,y,color,font);
    }
    _draw(){
        super._draw();
        this._drawTitleText();
    }
    _loop(){
        super._loop();
        if(this.mouseStatus==="down"){
            this.parent._moveWithMouse();
        }
    }
    
    onMouseLDown(){
        this.mouseStatus = "down";
        this.parent._saveMouseClientPos();
    }
    onMouseLUp(){
        this.mouseStatus = "up";
        this.parent._saveMouseClientPos();
    }
}

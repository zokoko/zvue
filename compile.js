/*
 * @Author: zokoko
 * @Date:   2020.12.6
 * @Dsc:  仿vue框架原理
 */
//用法 new Compile(el,vm)

class Compile {
    constructor(el, vm) {
            //要遍历的宿主节点
            this.$el = document.querySelector(el);
            this.$vm = vm; //在其他方法中方便使用
            //编译
            if (this.$el) {
                //转换内部内容为片段Fragment
                this.$fragment = this.node2Fragment(this.$el);
                //执行编译
                this.compile(this.$fragment);
                //将编译完的html追加到$el
                this.$el.appendChild(this.$fragment);
            }
        }
        //将宿主元素中的代码片段拿出来遍历，这样做比较高效
    node2Fragment(el) {
        //创建一个代码块
        const frag = document.createDocumentFragment();
        //将el中所有子元素“搬家”（移动）到frag中
        let child;
        while (child = el.firstChild) {
            frag.appendChild(child);
        }
        return frag;
    }
    compile(el) {
        const childNodes = el.childNodes;
        Array.from(childNodes).forEach(node => {
            //判断类型
            if (this.isElement(node)) {
                //元素
                console.log('编译元素', node.nodeName);
                //查找k-, @, :
                const nodeAttrs = node.attributes;
                Array.from(nodeAttrs).forEach(attr => {
                    const attrName = attr.name;
                    const exp = attr.value;
                    if (this.isDirective(attrName)) {
                        //k-text
                        const dir = attrName.substring(2);
                        //执行指令
                        this[dir] && this[dir](node, this.$vm, exp);
                    }
                    if (this.isEvent(attrName)) {
                        //@click
                        let dir = attrName.substring(1); // text
                        this.eventHandler(node, this.$vm, exp, dir);
                    }
                })
            } else if (this.isInterpolation(node)) {
                //插值文本{{}}
                console.log('编译文本', node.nodeName);
                this.compileText(node);
            }
            //递归子节点
            if (node.childNodes && node.childNodes.length > 0) {
                this.compile(node)
            }
        })
    }
    isDirective(attr) {
        return attr.indexOf('k-') == 0;
    }
    isEvent(attr) {
        return attr.indexOf('@') == 0;
    }
    isElement(node) {
            return node.nodeType === 1;
        }
        //插值文本
    isInterpolation(node) {
            return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
        }
        //编译文本
    compileText(node) {
            //console.log(RegExp.$1);    //正则对象RegExp的静态属性$1就是第一个匹配的值 就是上面'name'
            //node.textContent = this.$vm.$data[RegExp.$1];
            this.updata(node, this.$vm, RegExp.$1, 'text');
        }
        /*
         * @作用: 更新函数 根据指令决定是哪个更新器 它将来需要知道（参数）
         * @params: node 更新的节点
         * @params: vm    zvue的实例
         * @params: exp 正则表达式    匹配的结果 如：name
         * @params: dir    指令（文本、事件、其他） 如：text,html,model
         * 这个方法是个通用方法，将来要被调用很多次
         */
    updata(node, vm, exp, dir) {
            const updaterFn = this[dir + 'Updater']; //在当前的类里面组合一个函数名
            /*这种写法和 this.a 一样，this是代表当前对象，也是一个对象，
            对象名.方法名 或 对象名.属性名 调用对象中的属性和方法
            还有一种调用方式：对象名['方法名'] 或 对象名['属性名']
            也可以使用 对象名['方法名']() 执行此方法
            */
            //先判断updaterFn是否存在，如果存在则执行
            updaterFn && updaterFn(node, vm[exp]); //初始化（第一次）
            //依赖收集
            new Watcher(vm, exp, function(value) {
                //观察vm 里的exp(属性)，并在属性变化时，如何更新
                updaterFn && updaterFn(node, value);
            })
        }
        //更新的具体操作
    textUpdater(node, value) {
        node.textContent = value;
    }
    text(node, vm, exp) {
            this.updata(node, vm, exp, 'text');
        } 
        // 事件处理     
    eventHandler(node, vm, exp, dir) {    
        let fn = vm.$options.methods && vm.$options.methods[exp];    
        if (dir && fn) {      
            node.addEventListener(dir, fn.bind(vm), false); 
        } 
    }
    model(node, vm, exp) {
        this.updata(node, vm, exp, 'model');    
        let val = vm.exp;    
        node.addEventListener('input', (e) => {      
            let newValue = e.target.value;      
            vm[exp] = newValue;      
            val = newValue;
        })
    }  
    modelUpdater(node, value) {
        node.value = value; 
    }
    html(node, vm, exp) {
        this.updata(node, vm, exp, 'html'); 
    }
    htmlUpdater(node, value) {
        node.innerHTML = value; 
    }


}
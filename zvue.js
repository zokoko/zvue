/*
 * @Author: zokoko
 * @Date:   2020.12.6
 * @Dsc:  仿vue框架原理
 */

// 用法： new ZVue({data:{...}})
class ZVue {
    constructor(options) {
        this.$options = options;
        //数据的响应化
        this.$data = options.data;
        this.observe(this.$data); //观察数据

        //模拟一下watcher创建
        // new Watcher();        //实例一
        // this.$data.test;
        // new Watcher();        //实例二    实例二不等于实例一
        // this.$data.foo.bar;
        new Compile(options.el, this);
        //生命周期函数
        //created
        if (options.created) {
            //options.created();    //本来是这样执行，下面的调用call()方法，为函数指定执行作用域
            options.created.call(this); //这样就可以在created函数中用this了。
        }
    }
    observe(obj) {
            //检验数据类型必须是对象
            if (!obj || typeof obj !== 'object') {
                return;
            }
            //遍历该对象
            Object.keys(obj).forEach(key => {
                this.defineReactive(obj, key, obj[key]);
                //代理配置项 data 中的属性到vue实例上
                this.proxyData(key);
            })
        }
        //数据响应化（数据劫持）
    defineReactive(obj, key, val) {
        this.observe(val); //递归解决数据的嵌套
        const dep = new Dep();
        Object.defineProperty(obj, key, {
            get() {
                Dep.target && dep.addDep(Dep.target);
                return val
            },
            set(newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // console.log(`${key}属性更新了：${newVal}`)
                dep.notify();
            }
        })
    }
    //代理函数（）
    proxyData(key) {
        Object.defineProperty(this, key, {
            get() {
                return this.$data[key];
            },
            set(newVal) {
                this.$data[key] = newVal;
            }
        })
    }

}
//vue 数据绑定的原理是什么？
//首先，把vue选项里的data中的每个属性都利用了Object.defineProperty()定义了一个属性，
//都定义了get和set这样的话让我们的机会监听数据和变化，
//当这些属性发生变化时，我们可以通知那些需要更新的地方去更新

//依赖搜集
//Dep: 用来管理 Watcher
class Dep {
    constructor() {
            //这里存在若干依赖（watcher,一个watcher对应一个属性）
            this.deps = [];
        }
        //添加依赖的方法，搜集依赖时，往这里面放东西
    addDep(dep) {
            this.deps.push(dep)
        }
        //通知方法，用来通知所有的watcher 去更新
    notify() {
        this.deps.forEach(dep => dep.updata())
    }

}

//Watcher 用来做具体更新的对象
class Watcher {
    constructor(vm, key, cb) {
        this.vm = vm;
        this.key = key;
        this.cb = cb;
        //将当前watcher实例指定到Dep静态属性target
        Dep.target = this;
        this.vm[this.key]; //触发getter，添加依赖
        Dep.target = null;
    }
    updata() {
        // console.log('属性更新了');
        this.cb.call(this.vm, this.vm[this.key])
    }
}
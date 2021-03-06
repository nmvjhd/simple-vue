/*
* 第二版
* 1. 实现overser、proxy data与method
* 2. 当set data时全量刷新tpl
* 3. 实现dep/watcher，允许用户手动收集依赖
* */

function observe(data) {
    if (!data || typeof data !== 'object') {
        return;
    }

    Object.keys(data).forEach(function (key) {
        let val = data[key];
        const dep = new Dep();

        observe(val);
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get: function () {
                // console.log('get ' + key);
                Dep.target && dep.addSub(Dep.target);
                return val;
            },
            set: function (newVal) {
                // console.log('set ' + key + ' val ' + val);
                val = newVal;
                dep.notify();
            },
        });
    });
}

Dep.target = null;

function Dep() {
    this.watchers = [];
}

Dep.prototype.addSub = function (sub) {
    this.watchers.push(sub);
};

Dep.prototype.notify = function () {
    this.watchers.forEach(function (watcher) {
        watcher.update();
    });
};

function Watcher(vm, exp, callback) {
    Dep.target = this;
    this.vm = vm;
    this.exp = exp;
    this.cb = callback;
    this.val = getVal(vm, exp);
    Dep.target = null;
}

Watcher.prototype.update = function () {
    const oldVal = this.val;
    const val = getVal(vm, this.exp);
    this.cb.call(this.vm, val, oldVal);
    this.val = val;

    this.vm.$mount();
};

function initData(vm) {
    proxyKey(vm, 'data');
    proxyKey(vm, 'methods');
    observe(vm.data);
}

function proxyKey(target, key) {
    const val = target[key];
    Object.keys(val).forEach(subKey => {
        proxy(target, key, subKey);
    });
}

function proxy(target, sourceKey, key) {
    Object.defineProperty(target, key, {
        enumerable: true,
        configurable: true,
        get: function () {
            return target[sourceKey][key];
        },
        set: function (val) {
            target[sourceKey][key] = val;
        },
    })
}

function compile(tpl, data) {
    console.log('compile');
    const dataReg = /{{.*}}/img;
    return tpl.replace(dataReg, function (val) {
        const innerVal = val.substr(2, val.length - 4).trim();
        return getVal(data, innerVal);
    });
}

const getVal = (data, keyPath) => keyPath.split('.').reduce((prevValue, currValue) => prevValue[currValue], data);

function SVue(options) {
    // init option
    this.vm = this;
    this.options = options;
    this.el = options.el;
    this.tpl = options.template;

    Object.assign(this, this.options);
    initData(this.vm);
    if(this.el) {
        this.$mount(this.el);
    }
}

SVue.prototype.$watch = function (exp, callback) {
    new Watcher(this.vm, exp, callback);
}

SVue.prototype.$mount = function (el) {
    const tpl = this.tpl;
    const resTpl = compile(tpl, this.vm);
    const rootEl = document.querySelector(el);
    if(rootEl) rootEl.innerHTML = resTpl;
};

const vm = new SVue({
    el: '#app',
    data: {
        a: 1,
        b: 'aaa',
        c: {
            d: 12,
            e: 'aaab',
        }
    },
    template: `<div>
        <div class="div-a">这是上面的div</div>
        <div class="div-b">b的值是<strong>{{b}}</strong></div>
        <div class="div-c">这是下面的div</div>
        <div class="div-d">c.d的值是<strong>{{c.d}}</strong></div>
    </div>`,
    methods: {
        hehe() {
            console.log('hehe');
        }
    }
});

vm.$watch('b', function (val, oldVal) {
    console.log('watched b changed from ', oldVal, ' to ', val);
});

vm.$watch('c.d', function (val, oldVal) {
    console.log('watched c.d changed from ', oldVal, ' to ', val);
});

vm.b = 222;
vm.c.d = 333;

/*
* 第一版
* 1. 实现overser、proxy data与method
* 2. 当set data时全量刷新tpl
* */

function observe(data) {
    if (!data || typeof data !== 'object') {
        return;
    }

    Object.keys(data).forEach(function (key) {
        let val = data[key];

        observe(val);
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get: function () {
                // console.log('get ' + key);
                return val;
            },
            set: function (newVal) {
                // console.log('set ' + key + ' val ' + val);
                val = newVal;
                SVue.target && SVue.target.$render();
            },
        });
    });
}

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

function render(tpl, data) {
    console.log('render');
    const dataReg = /{{.*}}/img;
    return tpl.replace(dataReg, function (val) {
        const innerVal = val.substr(2, val.length - 4).trim();
        return getVal(data, innerVal);
    });
}

const getVal = (data, keyPath) => keyPath.split('.').reduce((prevValue, currValue) => prevValue[currValue], data);

SVue.target = null;
function SVue(options) {
    SVue.target = this;
    // init option
    this.vm = this;
    this.options = options;
    this.el = options.el;
    this.tpl = options.template;

    Object.assign(this, options);
    initData(this.vm);
    if(this.el) {
        this.$render();
    }
}

SVue.prototype.$render = function () {
    const tpl = this.tpl;
    const resTpl = render(tpl, this.vm);
    const rootEl = document.querySelector(this.el);
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

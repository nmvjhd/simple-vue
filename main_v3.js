/*
* 第三版
* 1. 实现overser、proxy data与method
* 2. 当set data时只修改对应的dom（因为使用了compile）
* 3. 实现dep/watcher，允许用户手动收集依赖
* 4. 实现Compile，允许我们修改数据时只修改变化的dom
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
        Dep.target && dep.depend();
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

let uid = 0;

function Dep() {
  this.subs = [];
  this.uid = uid++;
}

Dep.prototype = {
  addSub: function (sub) {
    this.subs.push(sub);
  },
  removeSub: function () {
    this.subs.remove(sub);
  },
  depend: function () {
    Dep.target.addDep(this);
  },
  notify: function () {
    this.subs.forEach(function (sub) {
      sub.update();
    });
  },
};

function Watcher(vm, exp, callback) {
  Dep.target = this;
  this.vm = vm;
  this.exp = exp;
  this.cb = callback;
  // this.val = vm[exp];
  this.val = getVal(vm, exp);
  Dep.target = null;
}

Watcher.prototype.addDep = function (dep) {
  dep.addSub(this);
}

Watcher.prototype.update = function () {
  const oldVal = this.val;
  const val = getVal(vm, this.exp);
  this.cb.call(this.vm, val, oldVal);
  this.val = val;
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

// map tplDom to renderDom
function compile(tplDom, vm) {
  traverse(tplDom, function (dom) {
    if (isElementNode(dom)) { // 元素节点

    } else if (isTextNode(dom)) { // 非空文本节点
      compileTextNode(dom, vm);
    }
  })
}

function compileTextNode(node, vm) {
  const tpl = node.textContent.trim();
  const dataReg = /\{\{(.*)\}\}/img;
  if(!dataReg.test(tpl)) {
    return;
  }
  const innerVal = RegExp.$1;
  const resVal = getVal(vm, innerVal);
  node.textContent = tpl.replace(dataReg, resVal);

  vm.$watch(innerVal, (newVal, oldVal) => {
    console.log('watched ' + innerVal + ' changed from ', oldVal, ' to ', newVal);
    const tpl = node.textContent.trim();
    node.textContent = tpl.replace(oldVal, newVal);
  });
}

const isTextNode = (node) => node.nodeType === 3 && node.textContent.trim();

const isElementNode = (node) => node.nodeType === 1;

function traverse(dom, callback) {
  callback(dom);
  if(isElementNode(dom)) {
    for (let elem of dom.childNodes) {
      traverse(elem, callback);
    }
  }
}

function render(dom, vm) {
  compile(dom, vm);
}

const getVal = (data, keyPath) => keyPath.split('.').reduce((prevValue, currValue) => prevValue[currValue], data);

const tpl2Dom = (tpl) => {
  const $elem = document.createElement('div');
  $elem.innerHTML = tpl;
  return $elem.childNodes[0];
}

function SVue(options) {
  // init option
  this.vm = this;
  this.options = options;
  this.el = options.el;
  this.tpl = options.template;

  Object.assign(this, this.options);
  initData(this.vm);
  this.dom = tpl2Dom(this.tpl);
  if (this.el) {
    this.$render();
  }
}

SVue.prototype.$watch = function (exp, callback) {
  new Watcher(this.vm, exp, callback);
}

SVue.prototype.$render = function () {
  const dom = this.dom;
  render(dom, this.vm);
  const rootEl = document.querySelector(this.el);
  if (rootEl) rootEl.appendChild(dom);
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
        <div class="div-e">c.e的值是{{c.e}}</div>
    </div>`,
  methods: {
    hehe() {
      console.log('hehe');
    }
  }
});
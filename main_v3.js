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

// parse directives
function compile(tplDom, vm) {
  traverse(tplDom, function (dom) {
    if (isElementNode(dom)) { // 元素节点
      compileElementNode(dom, vm);
    } else if (isTextNode(dom)) { // 非空文本节点
      compileTextNode(dom, vm);
    }
  })
}

function compileTextNode(node, vm) {
  const text = node.textContent.trim();
  const dataReg = /\{\{(.*)\}\}/img;
  if(!dataReg.test(text)) {
    return;
  }
  const innerVal = RegExp.$1;
  const resVal = getVal(vm, innerVal);
  node.textContent = text.replace(dataReg, resVal);

  vm.$watch(innerVal, (newVal, oldVal) => {
    console.log('watched ' + innerVal + ' changed from ', oldVal, ' to ', newVal);
    const text = node.textContent.trim();
    node.textContent = text.replace(oldVal, newVal);
  });
}

function compileElementNode(node, vm) {
  const attrs = node.attributes;
  for(let attr of attrs) {
    const name = attr.name;
    const val = attr.value;
    if(isDirective(name)) {
      const directName = name.substring(2);
      Directives[directName].bind(node, val, vm);
    }
  }
}

const isTextNode = (node) => node.nodeType === 3 && node.textContent.trim();

const isElementNode = (node) => node.nodeType === 1;

const isDirective = (attr) => attr.indexOf('v-') === 0;

function traverse(dom, callback) {
  callback(dom);
  if(isElementNode(dom)) {
    for (let elem of dom.childNodes) {
      traverse(elem, callback);
    }
  }
}

const getVal = (data, keyPath) => keyPath.split('.').reduce((prevValue, currValue) => prevValue[currValue], data);

const tpl2Dom = (tpl) => {
  const $elem = document.createElement('div');
  $elem.innerHTML = tpl;
  return $elem.childNodes[0];
}

const Directives = {
  bind: {
    bind(node, key, vm) {
      this.update(node, getVal(vm, key)); // bind时也需要求一次值

    vm.$watch(key,(val, oldVal) => {
        this.update(node, val, oldVal);
    });
    },
    update(node, val) {
      node.textContent = val;
    },
    unbind() {

    },
  },
  if: {
    bind(node, dirVal, vm) {
        this.update(node, getVal(vm, dirVal));

        vm.$watch(dirVal,(val, oldVal) => {
            this.update(node, val, oldVal);
        });
    },
    update(node, dirVal) {
      if (!dirVal) {
        node.style = 'display:none;';
      } else {
        node.style = 'display: block;';
      }
    },
    unbind() {

    },
  },
  for: {
      bind(node, dirVal, vm) {
          console.log('for bind called');
          this.update(node, dirVal, vm);
      },
      update(node, dirVal, vm) {
          console.log('for update called');
          const keys = dirVal.split(/\s+/img);
          const vals = getVal(vm, keys[2]);
          for(let val of vals) {
              const newNode = document.createElement('div');
              newNode.innerText = val;
              node.parentNode.appendChild(newNode);
          }
      },
      unbind() {

      },
  }
};

function SVue(options) {
  // init option
  this.vm = this;
  this.options = options;
  this.el = options.el;
  this.tpl = options.template;

  Object.assign(this, this.options);
  initData(this.vm);
  if (this.el) {
    this.$mount(this.el);
  }
}

SVue.prototype.$watch = function (exp, callback) {
  new Watcher(this.vm, exp, callback);
};

SVue.prototype.$mount = function (el) {
  const dom = tpl2Dom(this.tpl);
  compile(dom, this.vm);
  const rootEl = document.querySelector(el);
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
    },
    f: false,
    g: ['aaa', 'bbb', 'ccc'],
  },
  template: `<div>
        <div v-bind="a"></div>
        <div v-if="f">哈哈</div>
        <div class="div-a">这是上面的div</div>
        <div class="div-b">b的值是<strong>{{b}}</strong></div>
        <div class="div-c">这是下面的div</div>
        <div class="div-d">c.d的值是<strong>{{c.d}}</strong></div>
        <div class="div-e">c.e的值是{{c.e}}</div>
        <div><div v-for="item in g">{{item}}</div></div>
    </div>`,
  methods: {
    hehe() {
      console.log('hehe');
    }
  }
});

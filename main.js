function observe(data) {
  if(!data || typeof data !== 'object') {
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
        console.log('get ' + key);
        Dep.target && dep.depend();
        return val;
      },
      set: function (newVal) {
        console.log('set ' + key + ' val ' + val);
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
  this.uid = uid ++;
}

Dep.prototype = {
  addSub: function(sub) {
    this.subs.push(sub);
  },
  removeSub: function() {
    this.subs.remove(sub);
  },
  depend: function () {
    Dep.target.addDep(this);
  },
  notify: function() {
    this.subs.forEach(function(sub) {
      sub.update();
    });
  },
};

function Watcher(vm, exp, callback) {
  Dep.target = this;
  this.vm = vm;
  this.exp = exp;
  this.cb = callback;
  this.val = vm[exp];
  Dep.target = null;
}

Watcher.prototype.addDep = function (dep) {
  dep.addSub(this);
}

Watcher.prototype.update = function () {
  const oldVal = this.val;
  const val = this.vm[this.exp];
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
  Object.defineProperty(target, key,{
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

function SVue(options) {
  this.vm = this;
  this.options = options;
  this._mergeOptions();
  initData(this.vm);
}

SVue.prototype.$watch = function (exp, callback) {
  new Watcher(this.vm, exp, callback);
}

SVue.prototype._mergeOptions = function () {
  Object.assign(this, this.options);
}

const vm = new SVue({
  data: {
    a: 1,
    b: 'aaa',
    c: {
      d: 12,
      e: 'aaab',
    }
  },
  methods: {
    hehe() {
      console.log('hehe');
    }
  }
});

// vm.$watch('a', function (val,oldVal) {
//   console.log('watched a change', val, oldVal);
// });

// vm.$watch('c.d', function (val, oldVal) {
//   console.log('watched c.d change', val, oldVal);
// });

// console.log(vm.a);
// vm.a = 222;
// vm.c.d = 333;

new Watcher(vm.c, 'd', function (val, oldVal) {
  console.log('watched c.d change to ', val,' from ', oldVal);
});


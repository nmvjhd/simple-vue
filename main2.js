const compose = (...fns) => fns.reduce((previousValue, currentValue) => (...args) => previousValue(currentValue(...args)));
const pipe = (...fns) => fns.reduce((previousValue, currentValue) => (...args) => currentValue(previousValue(...args)));
const chain = (...fns) => (...args) => fns.forEach(fn => fn(...args));

function f(a,b,c) {
  console.log(a + b + c);
}

function g(a,b,c) {
  console.log(a*b*c);
}

function h(a,b,c) {
  console.log(a-b-c);
}

// f = chain(f,g,h);
const m = R.chain(f,g,h);
m(10,20,30);
class Vue {
  constructor(options) {
    this.$options = options
    this._data = options.data
    this.initData()
  }
  initData() {
    let data = this._data
    let keys = Object.keys(data)
    for (let i = 0; i < keys.length; i++) {
      Object.defineProperty(this, keys[i], {
        enumerable: true,
        configurable: true,
        get: function proxyGetter() {
          return data[keys[i]]
        },
        set: function proxySetter(value) {
          data[keys[i]] = value
        },
      })
    }
    observe(data)
    this.initWatch()
  }
  initWatch() {
    let watch = this.$options.watch
    let keys = Object.keys(watch)
    for (let i = 0; i < keys.length; i++) {
      new Watcher(this, keys[i], watch[keys[i]])
    }
  }
  $watch(key, cb) {
    new Watcher(this, key, cb)
  }
  $set(target, key, value) {
    //触发前将新的属性也设置成响应式
    defineReactive(target, key, value)
    //在用户调用$set时,触发目标的__ob__.dep.notify()
    target.__ob__.dep.notify()
  }
}
function observe(data) {
  //data是基本类型则返回
  let type = Object.prototype.toString.call(data)
  if (type !== '[object Object]' && type !== '[object Array]') {
    return
  }
  if (data.__ob__) {
    return data.__ob__
  }
  return new Observer(data) //将Observer实例直接返回出去,这样在别的地方也可以拿到
}
//defineReactive函数定义三个参数(定义的值,定义的属性,原先的值)
function defineReactive(obj, key, value) {
  //为了继续观测数据,达到递归
  let childOb = observe(obj[key])
  let dep = new Dep()
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: true,
    get: function reactiveGetter() {
      //收集
      dep.depend()
      if (childOb) {
        childOb.dep.depend()
      }
      return value
    },
    set: function reactiveSetter(val) {
      if (val === value) {
        return
      }
      //通知
      dep.notify()
      value = val
    },
  })
}
//递归的逻辑
class Observer {
  constructor(data) {
    //给Observer实例里创建一个新的用来存储Dep实例的容器
    this.dep = new Dep()
    if(Array.isArray(data)){
      data.__proto__ = ArrayMethods
      this.observeArray(data)
    }else{
      this.walk(data)
    }
    //然后将Observer实例挂载到对象的__ob__属性上
    Object.defineProperty(data, '__ob__', {
      value: this,
      enumerable: false, //不可被枚举
      configurable: true,
      writable: true, //可以被修改
    })
  }
  walk(data) {
    let keys = Object.keys(data)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(data, keys[i], data[keys[i]])
    }
  }
  observeArray(arr){
    for(let i = 0; i < arr.length;i++){
      observe(arr[i])
    }
  }
}
//将属性存储在一个类的实例中
class Dep {
  constructor() {
    //用一个数组来存储属性
    this.subs = []
  }
  //收集
  depend() {
    if (Dep.target) {
      this.subs.push(Dep.target)
    }
  }
  //通知
  notify() {
    this.subs.forEach((watcher) => {
      //依次之执行回调函数
      watcher.run()
    })
  }
}
//将需要执行的函数抽取成一个类的实例
//设置一个watchid
let watchId = 0
let watchQueue = []
class Watcher {
  //三个参数,vue的实例,需要对哪一个属性进行求值,回调函数
  constructor(vm, exp, cb) {
    this.vm = vm
    this.exp = exp
    this.cb = cb
    this.id = ++watchId
    this.get()
  }
  //求值
  get() {
    //为了被其他人可以拿到所以挂载到Dep实例上
    Dep.target = this
    //求值
    this.vm[this.exp]
    //清空
    Dep.target = null
  }
  run() {
    if (watchQueue.indexOf(this.id) !== -1) {
      //说明已经存在队列中
      return
    }
    watchQueue.push(this.id)
    let index = watchQueue.length - 1
    Promise.resolve().then(() => {
      //将回调函数的this改成实例的
      this.cb.call(this.vm)
      // let index = watcherQueue.indexOf(this.id)
      watchQueue.splice(index, 1)
    })
  }
}
const ArrayMethods = []
ArrayMethods.__proto__ = Array.prototype
//将需要拦截的方法存入数组中
const methods = [
  'push',
  'pop'
]
//将每个方法存入ArrayMethods中
methods.forEach((method) =>{
  ArrayMethods[method] = function(...args){
    //为了让数组中的对象也实现响应式
    if(method === 'push'){
      this.__ob__.observeArray(args)
    }
   //为了保证自定义数组中能有跟原型的方法一样的功能,在自定义对象中的同名方法中执行原本的方法,
   let result =  Array.prototype[method].apply(this,args)
  //再去人为的调用__ob__dep.notify()去执行之前收集的回调
   this.__ob__.dep.notify()
    return result
  }
})
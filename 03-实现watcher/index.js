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
}
function observe(data) {
  //data是基本类型则返回
  let type = Object.prototype.toString.call(data)
  if(type !== '[object Object]' && type !== '[object Array]'){
    return
  }
  new Observer(data)
}
//defineReactive函数定义三个参数(定义的值,定义的属性,原先的值)
function defineReactive(obj, key, value) {
  //为了继续观测数据,达到递归
  observe(obj[key])
  let dep = new Dep()
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: true,
    get: function reactiveGetter() {
      dep.depend()
      return value
    },
    set: function reactiveSetter(val) {
      if (val === value) {
        return
      }
      dep.notify()
      value = val
    },
  })
}
//递归的逻辑
class Observer {
  constructor(data) {
    this.walk(data)
  }
  walk(data) {
    let keys = Object.keys(data)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(data, keys[i], data[keys[i]])
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
let watchId = 0;
let watchQueue = [];
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
    if(watchQueue.indexOf(this.id) !== -1){//说明已经存在队列中
      return
    }
    watchQueue.push(this.id)
    let index = watchQueue.length -1
    Promise.resolve().then(() =>{
      //将回调函数的this改成实例的
      this.cb.call(this.vm)
      // let index = watcherQueue.indexOf(this.id)
      watchQueue.splice(index,1)
    })
  }
}

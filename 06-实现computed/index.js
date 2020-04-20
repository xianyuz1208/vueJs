class Vue {
  constructor(options) {
    this.$options = options
    this._data = options.data
    this.initData()
    this.initComputed()
    this.initWatch()
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
  }
  initComputed() {
    let computed = this.$options.computed
    if (computed) {
      let keys = Object.keys(computed)
      for (let i = 0; i < keys.length; i++) {
        let watchter = new Watcher(this, computed[keys[i]], function () {}, {
          lazy: true,
        })
        Object.defineProperty(this, keys[i], {
          enumerable: true,
          configurable: true,
          get: function computedGetter() {
            //如果watcher的dirty是true的话,就会对watcher进行求值
            if (watchter.dirty) {
              watchter.get()
              watchter.dirty = false
            }
            if (Dep.target) {
              //将后面收集到的dep,把这些dep一个个拿出来通知他们收集
              for (let j = 0; j < watchter.deps.length; j++) {
                watchter.deps[j].depend()
              }
            }
            return watchter.value
          },
          set: function computedSetter() {
            console.warn('请不要给计算属性赋值')
          },
        })
      }
    }
  }
  initWatch() {
    let watch = this.$options.watch
    if (watch) {
      let keys = Object.keys(watch)
      for (let i = 0; i < keys.length; i++) {
        new Watcher(this, keys[i], watch[keys[i]])
      }
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
    if (Array.isArray(data)) {
      data.__proto__ = ArrayMethods
      this.observeArray(data)
    } else {
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
  observeArray(arr) {
    for (let i = 0; i < arr.length; i++) {
      observe(arr[i])
    }
  }
}
//解决watcher被覆盖没有被收集,我们需要维护一个栈
let targetStack = []
//将属性存储在一个类的实例中
class Dep {
  constructor() {
    //用一个数组来存储属性
    this.subs = []
  }
  //在dep中将watcher收集起来
  addSub(watcher) {
    this.subs.push(watcher)
  }
  //收集
  depend() {
    if (Dep.target) {
      //将自己传给watcher
      Dep.target.addDep(this)
    }
  }
  //通知
  notify() {
    this.subs.forEach((watcher) => {
      //依次之执行回调函数
      watcher.uqdate()
    })
  }
}
//将需要执行的函数抽取成一个类的实例
//设置一个watchid
let watchId = 0
let watchQueue = []
class Watcher {
  //三个参数,vue的实例,需要对哪一个属性进行求值,回调函数
  constructor(vm, exp, cb, options = {}) {
    this.dirty = this.lazy = !!options.lazy
    this.vm = vm
    this.exp = exp
    this.cb = cb
    this.id = ++watchId
    this.deps = []
    if (!this.lazy) {
      this.get()
    }
  }
  //在watcher中将dep收集起来
  addDep(dep) {
    //dep实例有可能被收集过,如果收集过,则直接返回
    if (this.deps.indexOf(dep) !== -1) {
      return
    }
    this.deps.push(dep)
    //将自己传给dep
    dep.addSub(this)
  }
  //求值
  get() {
    targetStack.push(this)
    //为了被其他人可以拿到所以挂载到Dep实例上
    Dep.target = this
    //exp也可能传入一个函数
    if (typeof this.exp === 'function') {
      //将值绑定在Watcher实例上的value属性
      this.value = this.exp.call(this.vm) //因为可以用this,所以需要绑定this
    } else {
      //求值
      this.value = this.vm[this.exp]
    }
    targetStack.pop()
    if (targetStack.length > 0) {
      //将栈顶的watcher拿出来放到Dep实例上
      Dep.target = targetStack[targetStack.length - 1]
    } else {
      //清空
      Dep.target = null
    }
  }
  uqdate() {
    //如果是lazy watcher,则给自己一个标记
    if (this.lazy) {
      this.dirty = true
    } else {
      this.run()
    }
  }
  run() {
    if (watchQueue.indexOf(this.id) !== -1) {
      //说明已经存在队列中
      return
    }
    watchQueue.push(this.id)
    let index = watchQueue.length - 1
    Promise.resolve().then(() => {
      //后续watcher回调运行的时候还是要将属性再求值一遍
      this.get()
      //将回调函数的this改成实例的
      this.cb.call(this.vm)
      let index = watcherQueue.indexOf(this.id)
      watchQueue.splice(index, 1)
    })
  }
}
const ArrayMethods = {}
ArrayMethods.__proto__ = Array.prototype
//将需要拦截的方法存入数组中
const methods = ['push', 'pop']
//将每个方法存入ArrayMethods中
methods.forEach((method) => {
  ArrayMethods[method] = function (...args) {
    //为了让数组中的对象也实现响应式
    if (method === 'push') {
      this.__ob__.observeArray(args)
    }
    //为了保证自定义数组中能有跟原型的方法一样的功能,在自定义对象中的同名方法中执行原本的方法,
    let result = Array.prototype[method].apply(this, args)
    //再去人为的调用__ob__dep.notify()去执行之前收集的回调
    this.__ob__.dep.notify()
    return result
  }
})

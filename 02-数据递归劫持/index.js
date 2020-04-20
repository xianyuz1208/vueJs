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
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: true,
    get: function reactiveGetter() {
      console.log(`${key}取值`)
      return value
    },
    set: function reactiveSetter(val) {
      if (val === value) {
        return
      }
      console.log(`${key}的值发生了改变`)
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
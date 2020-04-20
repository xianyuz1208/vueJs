class Vue {
  //构造器中获取到值
  constructor(options) {
    this.$options = options
    this._data = options.data
    this.initData()
  }
  initData() {
    let data = this._data
    let keys = Object.keys(data)
    for (let i = 0; i < keys.length; i++) {
      // console.log(this)
      //给vue的实例添加上数据
      Object.defineProperty(this,keys[i],{
        enumerable:true,
        configurable:true,
        //获取到data中值
        get:function proxyGetter(){
          console.log(i)
          return data[keys[i]]
        },
        //值发生改变时触发
        set:function proxySetter(value){
          console.log(i)
          data[keys[i]] = value
        }
      })
    }
  }
}

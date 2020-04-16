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
      // console.log(this)
      Object.defineProperty(this,keys[i],{
        enumerable:true,
        configurable:true,
        get:function proxyGetter(){
          console.log(i)
          return data[keys[i]]
        },
        set:function proxySetter(value){
          console.log(i)
          data[keys[i]] = value
        }
      })
    }
  }
}

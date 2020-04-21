class VNode{
  constructor(tag,attrs,children,text){
    this.tag = tag,
    this.attrs = attrs,
    this.children = children,
    this.text = text
  }
}
function patch(oldNode,newNode){
  const isRealElement = oldNode.nodeType //如果有这个属性,代表它是一个真实的dom,是旧值
  if(isRealElement){
    const parent = oldNode.parentNode
    //找父节点然后替换掉新生成的dom
    parent.replaceChild(createElm(newNode),oldNode)
    return
  }
  //当前vnode对应的真实dom
  let el = oldNode.elm
  if(newNode){
    //将原来的dom重新赋值给新的vnode.elm
    newNode.elm = el
  }
  //当前vnode对应的真实dom的父级元素
  let parent = el.parentNode
  if(!newNode){//新节点不存在则删除对应的dom
    parent.removeChild(el)
  }else if(changed(newNode,oldNode)){//新旧节点标签不一样或者文本不一样,则调用createElm生成新dom,并替换旧dom
    parent.replaceChild(createElm(newNode),el)
  }else if(newNode.children){
    const newLength = newNode.children.length
    const oldLength = oldNode.children.length
    for(let i = 0; i < newLength || i<oldLength; i++){
      if(i >= oldLength){//在子元素中去判断,旧节点不存在，新节点存在，则调用`createElm`生成新dom，并原dom后`添加`新dom
        el.appendChild(createElm(newNode.children[i]))
        //el就是当前元素(也就是newNode)的父元素
      }else{
        //递归以上逻辑
        patch(oldNode.children[i],newNode.children[i])
      }
    }
  }
  function changed(newNode,oldNode){
    return (newNode.tag !== oldNode.tag || newNode.text !== oldNode.text)
  }
}
//将vdom转化为真正的dom
function createElm(vnode){
  //如果是文本节点
  if(!vnode.tag){
    const el = document.createTextNode(vnode.text)
    vnode.elm = el //代表当前dom
    return el
  }
  const el = document.createElement(vnode.tag)
  vnode.elm = el
  vnode.children.map(createElm).forEach((chilDom)=>{
    el.appendChild(chilDom)//将子节点挂载到el上
  })
  return el
}
//将AST转换为渲染函数的函数体
function generate(ast){
  let code = genElement(ast)
  return{
    render:`with(this){return ${code}}`
  }
}
//遍历后代节点
function genChildren(el){
  if(el.children.length > 0){
    return "[" + el.children.map(child =>genNode(child)).join(',') +"]"
  }
}
//转换元素节点
function genElement(el){
  let children = genChildren(el)
  return `_c(${JSON.stringify(el.tag)},{},${children})`
}
//遍历文本节点
function genText(node){
  if(node.type === 2){//带文本的变量
    return `_v(_s(${node.expression}))`
  }else if(node.type === 3){//纯文本
    return `_v(${JSON.stringify(node.text)})`
  }
}
//转换节点
function genNode(node){
  if(node.type === 1){
    return genElement(node)
  }else{
    return genText(node)
  }
}
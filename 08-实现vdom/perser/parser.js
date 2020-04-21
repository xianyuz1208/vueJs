/**
 * {
  children: [{…}],
  parent: {},
  tag: "div",
  type: 1, //1-元素节点 2-带变量的文本节点 3-纯文本节点，
  expression:'_s(name)', //type如果是2，则返回_s(变量)
  text:'{{name}}' //文本节点编译前的字符串
}
 */
function parser(html) {
  let stack = [] //栈
  let root //根节点
  let currentParent //父节点

  while (html) {
    let ltIndex = html.indexOf('<')
    if (ltIndex > 0) { //说明前面有文本
      let text = html.slice(0, ltIndex)
      // const element = {
      //   parent: currentParent,
      //   text,
      //   type: 3,
      // }
      const element = parseText(text)
      element.parent = currentParent
      currentParent.children.push(element)
      html = html.slice(ltIndex)
    } else if (html[ltIndex + 1] !== '/') {//前面没有文本,即开始标签
      
      let gtIndex = html.indexOf('>')
      const element = {
        type: 1,
        tag: html.slice(ltIndex + 1, gtIndex), //不考虑dom的任何属性
        children: [],
        parent: currentParent,
      }
      if (!root) {
        root = element
      } else {
        currentParent.children.push(element)
      }
      stack.push(element)
      currentParent = element
      html = html.slice(gtIndex + 1)
    } else { //结束标签
     
      let gtIndex = html.indexOf('>')
      stack.pop() //将当前层级退出,pop完之后就变成了上一个
      currentParent = stack[stack.length - 1] //将当前stack的最后一个元素赋值给父元素
      html = html.slice(gtIndex + 1)
    }
  }
  return root
}
function parseText(text) {
  let originText = text
  let type = 3
  let tokens = [] //将解析的东西推入tokens数组里
  while (text) {
    let start = text.indexOf('{{')
    let end = text.indexOf('}}')
    if (start !== -1 && end !== -1) {//说明有插值变量
      type = 2
      if (start > 0) {//说明是纯文本
        tokens.push(JSON.stringify(text.slice(0,start)))
      }
       let exp = text.slice(start+2,end)
       tokens.push(`_s(${exp})`)
       text = text.slice(end+2)
    }else{
      tokens.push(JSON.stringify(text))
      text = ''
    }
  }

  let element = {
    text: originText,
    type,
  }
  if(type === 2 ){
    element.expression = tokens.join('+')
  }
  return element
}


import { sizeMap, fontFamilyMap } from '../Utils/slateUtilityFunctions.js'


export const Leaf = ({ attributes, children, leaf }) => {
    
    if (leaf.bold) {
      children = <strong>{children}</strong>
    }
  
    if (leaf.code) {
      children = <code>{children}</code>
    }
  
    if (leaf.italic) {
      children = <em>{children}</em>
    }
    if(leaf.strikethrough){
        children = <span style={{textDecoration:'line-through'}}>{children}</span>
    }
    if (leaf.underline) {
      children = <u>{children}</u>
    }
    if(leaf.superscript){
        children = <sup>{children}</sup>
    }
    if(leaf.subscript){
        children = <sub>{children}</sub>
    }
    if(leaf.color){
        children = <span style={{color:leaf.color}}>{children}</span>
    }
    if(leaf.bgColor){
        children = <span style={{backgroundColor:leaf.bgColor}}>{children}</span>
    }
    if(leaf.fontSize){
        const size = sizeMap[leaf.fontSize]
        children = <span style={{fontSize:size}}>{children}</span>
    }
    if(leaf.fontFamily){
        const family = fontFamilyMap[leaf.fontFamily]
        children = <span style={{fontFamily:family}}>{children}</span>
    }
    return <span {...attributes}>{children}</span>
}
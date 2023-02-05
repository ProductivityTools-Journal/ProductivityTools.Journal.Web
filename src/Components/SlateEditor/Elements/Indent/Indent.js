import React from 'react'
import { useSelected, useFocused } from "slate-react";


const Indent = ({ attributes, element, children }) => {
  const {url,width,height} = element;
  const selected = useSelected();
  const focused = useFocused();
  console.log(width,height);

  console.log("Ident");
  console.log(attributes);
  console.log(element);
  console.log(children);
  return(
    <ul><li>{children}</li></ul>
  )
//   return (
//     <div
//       {...attributes}
//       className='element-image'
//       style={{display:'flex',justifyContent:'center',boxShadow: selected && focused &&  '0 0 3px 3px lightgray'}}
//     >
//       <div contentEditable={false} style={{width:width,height:height}}>
//         <img alt={element.alt} src={url}/>
//       </div>
//       {children}
//     </div>
//   );
};
export default Indent;
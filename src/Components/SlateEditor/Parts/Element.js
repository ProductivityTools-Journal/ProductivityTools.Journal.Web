import Link from'../Elements/Link/Link'
import Image from '../Elements/Image/Image'
import Video from '../Elements/Video/Video'


export const Element = (props) =>{

    const {attributes, children, element} = props;
    console.log(props);
    console.log("props");
    console.log(element.type);
    switch(element.type){
        case 'title':
            return <h1 {...attributes}>{children}</h1>
        case 'headingOne':
            return <h1 {...attributes}>{children}</h1>
        case 'headingTwo':  
            return <h2 {...attributes}>{children}</h2>
        case 'headingThree':
            return <h3 {...attributes}>{children}</h3>
        case 'blockquote':
            return <blockquote {...attributes}>{children}</blockquote>
        case 'alignLeft':
            return <div style={{textAlign:'left',listStylePosition:'inside'}} {...attributes}>{children}</div>
        case 'alignCenter':
            return <div style={{textAlign:'center',listStylePosition:'inside'}} {...attributes}>{children}</div>
        case 'alignRight':
            return <div style={{textAlign:'right',listStylePosition:'inside'}} {...attributes}>{children}</div>
        case 'list-item':
            return  <li {...attributes}>{children}</li>
        case 'orderedList':
            return <ol type='1' {...attributes}>{children}</ol>
        case 'unorderedList':
            return <ul {...attributes}>{children}</ul>
        case 'increaseIndent':
            return <ul {...attributes}><li>{children}</li></ul>
        case 'link':
            return <Link {...props}/>
        case 'table':
            return <table>
                <tbody {...attributes}>{children}</tbody>
            </table>
        case 'table-row':
            return <tr {...attributes}>{children}</tr>
        case 'table-cell':
            return <td {...attributes}>{children}</td>
        case 'image':
            return <Image {...props}/>
        case 'video':
            return <Video {...props}/>
        default :
            return <p {...attributes}>{children}</p>
    }
}


import React, { useEffect, useState } from 'react'

import './index.css'

const ContextMenu = ({ parentRef, items }) => {

    const [isVisible, setIsVisible] = useState(false);
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const [selectedTreeId, setSelectedTreeId] = useState();

    useEffect(() => {
        const parent = parentRef.current;
        if (!parent) {
            return;
        }

        console.log(parentRef);

        const showMenu = (event) => {
            console.log(event);
            event.preventDefault();
            setIsVisible(true);
            setX(event.clientX);
            setY(event.clientY);
            console.log('show');
            console.log(event.path)
           // let reversedArray = event.path.reverse();
            ///let li = reversedArray.find(e => e.nodeName === 'LI');
            //let id=li.attributes.find(e=>e.name='xxxx')
            //   console.log(event.path.find(e=>e.nodeName=='LI').getAttribute('contextmenuid'));
            let elementId = event.path.find(e => e.nodeName === 'LI').getAttribute('contextmenuid');
            setSelectedTreeId(elementId);
            console.log("selectet tree id")
            console.log(elementId);
        }

        const closeMenu = () => {
            setIsVisible(false);
        }

        parent.addEventListener('contextmenu', showMenu);
        window.addEventListener('click', closeMenu);

        return function cleanup() {
            parent.removeEventListener('contextmenu', showMenu);
            parent.removeEventListener('click', closeMenu);
        }
    })

    const style = {
        top: y,
        left: x
    };


    return isVisible ? (
        <div className='context-menu' style={style}>
            {items.map((item, index) => {
                return (
                    <div key={index}
                        onClick={() => item.onclick(selectedTreeId)}
                        className='context-menuItem'>
                        {item.text}
                    </div>
                )
            })}
        </div>
    ) : null
}

export default ContextMenu;
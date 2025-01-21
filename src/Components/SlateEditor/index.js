import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import React, { useState, useCallback, useEffect, useMemo } from "react";
import './Editor.css'
import withLinks from './Plugins/withLinks'
import { Element } from './Parts/Element.js'
import { Leaf } from './Parts/Leaf.js'
import {
    Transforms,
    createEditor,
    Text,
    Node,
    Editor,
    Element as SlateElement,
    Descendant,
} from 'slate'




import { Slate, Editable, withReact } from 'slate-react'
//import { ListType, withLists, withListsReact, onKeyDown } from '@prezly/slate-lists'; trzeba to skasować
import Toolbar from './Toolbar'
import { autocompleteClasses } from '@mui/material';
import { useDebugValue } from 'react';




const withLayout = editor => {
    const { normalizeNode } = editor
    editor.normalizeNode = ([node, path]) => {
        if (editor.changingContent == true) return;
        //debugger;
        if (path.length === 0) {
            if (editor.children.length < 1) {
                const title = {
                    type: 'title',
                    children: [{ text: 'Untitled' }],
                }
                Transforms.insertNodes(editor, title, { at: path.concat(0) })
            }

            if (editor.children.length < 2) {
                const paragraph = {
                    type: 'paragraph',
                    children: [{ text: '' }],
                }
                Transforms.insertNodes(editor, paragraph, { at: path.concat(1) })
            }

            for (const [child, childPath] of Node.children(editor, path)) {
                const slateIndex = childPath[0]

                if (slateIndex == 0) {

                    Transforms.setNodes(editor, { type: 'title' }, {
                        at: childPath,
                    })
                }
                if (slateIndex > 0 && child.type == 'title') {
                    Transforms.setNodes(editor, { type: 'paragraph' }, {
                        at: childPath,
                    })
                }
            }
        }

        return normalizeNode([node, path])
    }

    return editor
}

export default function SlateEditor({ pageId, pageContentObject, readOnly, pageContentObjectChanged }) {
    // console.log("SlateEditor");
    // console.log(pageContentObject);
    const editor = useMemo(() => withLayout(withReact(createEditor())), [])
    //const editor = useMemo(() => withReact(createEditor()), [])
    // const [value, setValue] = useState([{
    //     type: 'paragraph',
    //     children: [{ text: 'empty' }],
    // },])
    const [title, setTitle] = useState('nothing');

    //slate doesn't react to change state
    //to change value in slate we need to remove all lines and insert new ones

    useEffect(() => {
        // console.log("Useffect Page Json content")
        // console.log(pageId);
        changeContent();
    }, [])


    // const getSlateStructureFromRawDetails = (rawDetails, title) => {
    //     let template = [{
    //         type: 'title',
    //         children: [{ text: title || "Title" }],
    //     }, {
    //         type: 'paragraph',
    //         children: [{ text: rawDetails || "No data" }],
    //     },]
    //     return template;
    // }

    const checkIfDetailsContainsTitle = (detailsObject, title) => {
        let detailsTitle = detailsObject[0].children[0].text;
        if (detailsTitle != title) {
            detailsObject.unshift({
                type: 'paragraph',
                children: [{ text: title }],
            });
        }
        return detailsObject;
    }

    const changeContent = () => {

        if (pageContentObject == undefined) { return; }

        editor.changingContent = true;
        let rawDetails = pageContentObject;
        // let detailsType = pageContentObject?.detailsType;
        // let title = pageContentObject.name;

        let newValue = ''
        //if (detailsType == 'Slate') {
        // console.log("pageContentObject")
        // console.log(pageContentObject)
        let detailsObject = pageContentObject;


        if (detailsObject && Object.keys(detailsObject).length > 0 && Object.getPrototypeOf(detailsObject) != Object.prototype) {
            let detailsTitle = detailsObject[0].children[0].text;
            //tytul, nie jestem pewien czy to potrzebuje
            // debugger;
            // if (detailsTitle != title) {
            //     detailsObject = [{
            //         type: 'title',
            //         children: [{ text: title }],
            //     }].concat(detailsObject);
            // }

            //koniec tutulu
            newValue = detailsObject;

        }
        // else {
        //     newValue = getSlateStructureFromRawDetails(rawDetails, title);
        // }
        // }
        // else {
        //     newValue = getSlateStructureFromRawDetails(rawDetails, title);;
        // }
        // console.log("details");
        // console.log(rawDetails);
        // console.log("NewVAlue");
        // console.log(newValue);
        let totalNodes = editor.children.length

        // No saved content, don't delete anything to prevent errors
        if (pageContentObject.length <= 0) {
            editor.changingContent = false;
            return
        }



        // Remove every node except the last one
        // Otherwise SlateJS will return error as there's no content
        for (let i = 0; i < totalNodes - 1; i++) {
            // console.log(i);
            // console.log(editor.children);
            Transforms.removeNodes(editor, {
                at: [0],
            })
        }
        // debugger;
        // let detailsTitle = newValue[0].children[0].text;
        // if (detailsTitle != title) {
        //     let newElement = {
        //         type: 'paragraph',
        //         children: [{ text: title }],
        //     }
        //     Transforms.insertNodes(editor, newElement, {
        //         at: [editor.children.length],
        //     })
        // }

        // Add content to SlateJS
        for (const v1 of newValue) {
            Transforms.insertNodes(editor, v1, {
                at: [editor.children.length],
            })
        }

        // Remove the last node that was leftover from before
        Transforms.removeNodes(editor, {
            at: [0],
        })
        editor.changingContent = false;
    }
    //Saving above

    const renderElement = useCallback(props => <Element {...props} />, [])

    const renderLeaf = useCallback(props => {
        return <Leaf {...props} />
    }, [])

    const editorChanged = (newValue) => {
        // console.log("new value");
        // console.log(newValue);
        if (editor.changingContent) return;
        // setValue(newValue);
        //pageContentObjectChanged(newValue)
        // let title = editor.children[0].children[0].text;
        // setTitle(title);
        //props.titleChanged(title);
    }
    if (pageContentObject == undefined) {
        return (<div>waiting</div>)
    }
    else {
        // if (readOnly) {
        // console.log("pageContentObject")
        // console.log(pageContentObject)
        // console.log("readonly")
        // console.log(readOnly);
        return (
            <div>
                {/* <p>raw content:</p>
                <p>{pageContentObject && pageContentObject.length > 0 && pageContentObject[0].children[0].text}</p> */}
                <Slate editor={editor} value={pageContentObject} onChange={editorChanged}>
                    {readOnly ? <span></span> : <Toolbar />}
                    <div className="editor-wrapper" style={{ border: '1px solid #f3f3f3', padding: '0 10px' }}>
                        <Editable readOnly={readOnly}
                            placeholder='Write something'
                            renderElement={renderElement}
                        // renderLeaf={renderLeaf}
                        />
                    </div>
                </Slate>
            </div>)
        // }
        // else {
        //     return (
        //         <div>
        //             <div style={{ width: '100%', margin: '0 auto' }}>
        //                 <Slate editor={editor} value={pageContentObject} onChange={editorChanged}>
        //                     <Toolbar />

        //                     <div className="editor-wrapper" style={{ border: '1px solid #f3f3f3', padding: '0 10px' }}>
        //                         <Editable
        //                             onKeyDown={(event) => onKeyDown(editor, event)}
        //                             placeholder='Write something'
        //                             renderElement={renderElement}
        //                             renderLeaf={renderLeaf}
        //                         />
        //                     </div>
        //                 </Slate>
        //             </div>
        //             {/* <div>slate title: {title}</div>
        //         <div><textarea value={JSON.stringify(value)}></textarea></div> */}
        //         </div>
        //     )
        // }
    }
}
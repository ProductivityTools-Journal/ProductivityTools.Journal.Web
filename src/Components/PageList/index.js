import React, { useEffect, useState } from 'react';
import Page from 'Components/Page';
import * as apiService from 'services/apiService'
import Button from '@mui/material/Button';
import { v4 as uuid } from 'uuid';
import { useAuth } from '../../Session/AuthContext'
import * as Common from '../Common.js'



export default function PageList({ selectedTreeNode }) {

    const [pages, setPages] = useState([]);

    useEffect(() => {
        console.log("selectedTreeNode");
        console.log(selectedTreeNode);
        const fetchData = async () => {
            const data = await apiService.fetchPageList(selectedTreeNode.id);
            data.forEach(element => {
                element.frontendId = uuid()
            });
            setPages(data);
        }
        if (selectedTreeNode != null) {
            fetchData();
        }
        //console.log("fetching data");
    }, [selectedTreeNode?.id]);

    const updatePageInList = (page) => {
        return;
        // console.log("updateMeetingInList");
        // console.log(page);
        // console.log(pages);
        let updatedList = pages.map(item => {
            if (item.frontendId === page.frontendId) {
                if (page.Deleted == true) {
                    //do nothing
                }
                else {
                    let r = { ...item, ...page }
                    return r;
                }
            }
            else {
                return item;
            }
        }).filter(item => item != undefined);
        debugger;
        setPages(updatedList);
    }

    const newEvent = () => {
        //console.log('new event');

        let newPage = Common.getNewPage(selectedTreeNode);
        newPage.mode = 'edit';
        //let newPage = [{ frontendId: uuid(), mode: 'edit', subject: 'InitialMeetingName', treeId: props.selectedTreeNode, notesList: [{ type: 'new', notes: 'Add notes here', guid: uuid() }] }]
        setPages([newPage, ...pages]);
    }

    const checkState = () => {
        console.log(pages);
    }
    return (
        <div className="App" style={{ color: '#3b3d3b', marginLeft: '400px', width: '1200px' }} >
            <Button onClick={newEvent} >Add New</Button>
            <Button onClick={checkState} >CheckSatate</Button>

            {pages && pages.length > 0 && pages.map(function (item) {
                return (
                    <Page page={item} updatePageInList={updatePageInList} key={item.frontendId} />
                );
            })}



            {/* <p>Pages:</p>
            {pages && pages.length > 0 && [].concat(pages)
            .sort((a,b)=>a.Date>b.Date?1:-1)
            .map(function (item) {
                return (
                    <Page page={item} updateMeetingInList={updateMeetingInList} key={item.PageId} />
                );
            })} */}

        </div>
    );
}

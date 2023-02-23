import React, { useEffect, useState } from 'react';
import Page from 'Components/Page';
import * as apiService from 'services/apiService'
import Button from '@mui/material/Button';
import { v4 as uuid } from 'uuid';
import { useAuth } from '../../Session/AuthContext'


export default function PageList(props) {

    const [pages, setPages] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const data = await apiService.fetchPageList(props.selectedTreeNode);
            data.forEach(element => {
                element.frontendId = uuid()
            });
            setPages(data);
        }
        fetchData();
        console.log("fetching data");
    }, [props.selectedTreeNode]);

    const updateMeetingInList = (meeting) => {

        //page refactor, I am not sure if this is needed
        return
        console.log(meeting);
        console.log("updateMeetingInList");
        console.log(pages);
        let updatedList = pages.map(item => {
            if (item.frontendId === meeting.frontendId) {
                if (meeting.Deleted == true) {
                    //do nothing
                }
                else {
                    let r = { ...item, ...meeting }
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
        console.log('new event');
        let newPage = [{ frontendId: uuid(), mode: 'edit', subject: 'InitialMeetingName', treeId: props.selectedTreeNode, notesList: [{ type: 'new', notes: 'Add notes here', guid: uuid() }] }]
        setPages([...newPage, ...pages]);
    }

    const checkState = () => {
        console.log(pages);
    }
    return (
        <div className="App" style={{ color: '#3b3d3b', marginLeft: '400px', width: '1200px' }} >
            <Button onClick={newEvent} >Add New</Button>
            <Button onClick={checkState} >CheckSatate</Button>
            <p>Pages:</p>
            {pages && pages.length > 0 && pages.map(function (item) {
                return (
                    <Page page={item} updateMeetingInList={updateMeetingInList} key={item.PageId} />
                );
            })}

        </div>
    );
}

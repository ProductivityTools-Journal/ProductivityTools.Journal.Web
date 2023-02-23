import { v4 as uuid } from 'uuid';

export const getSlateStructureFromRawDetails = (rawDetails, title) => {
    let template = [{
        type: 'title',
        children: [{ text: title || "Title" }],
    }, {
        type: 'paragraph',
        children: [{ text: rawDetails || "No data" }],
    },]
    return template;
}

export const getNewPageArray=(journalId)=>{
    let page=getNewPage(journalId);
    let result=[page];
    debugger;
    return result;
}

export const getNewPage=(journalId)=>
{
    let result={date: "2022-02-15T00:00:00",
        frontendId: uuid(),
        journalId: journalId,
        notes: getSlateStructureFromRawDetails('notes','Page'),
        notesType: 'Slate',
        subject: "Page"}
    return result;
}
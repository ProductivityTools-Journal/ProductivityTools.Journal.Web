import { v4 as uuid } from 'uuid';

export const getJsonSlateStructureFromRawDetails = (title,rawDetails) => {
    let template = [{
        type: 'title',
        children: [{ text: title || "Title" }],
    }, {
        type: 'paragraph',
        children: [{ text: rawDetails || "" }],
    },]
    return template;
}

export const getStringSlateStructureFromRawDetails=(rawDetails, title)=>{
    let o=getJsonSlateStructureFromRawDetails(rawDetails,title);
    let r=JSON.stringify(o)
    return r;
}

export const getNewPageArray=(journalId)=>{
    let page=getNewPage(journalId);
    let result=[page];
    return result;
}

export const getNewPage=(journalId)=>
{
    let result={date: undefined,
        frontendId: uuid(),
        journalId: journalId,
        content:getStringSlateStructureFromRawDetails('Page',''),
        // content: '[{"type":"title","children":[{"text":"a3"}]},{"type":"paragraph","children":[{"text":"Add notes here"}]}]',
        contentType: 'Slate',
        subject: "Page"}
    return result;
}
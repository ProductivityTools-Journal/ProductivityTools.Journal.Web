import { v4 as uuid } from 'uuid';

export const getJsonSlateStructureFromRawDetails = (rawDetails, title) => {
    let template = [{
        type: 'title',
        children: [{ text: title || "Title" }],
    }, {
        type: 'paragraph',
        children: [{ text: rawDetails || "No data" }],
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
    let result={date: "2022-02-15T00:00:00",
        frontendId: uuid(),
        journalId: journalId,
        content:getStringSlateStructureFromRawDetails('dd','dd3'),
        // content: '[{"type":"title","children":[{"text":"a3"}]},{"type":"paragraph","children":[{"text":"Add notes here"}]}]',
        contentType: 'Slate',
        subject: "Page"}
    return result;
}
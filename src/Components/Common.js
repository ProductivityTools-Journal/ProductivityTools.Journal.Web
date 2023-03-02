import { v4 as uuid } from 'uuid';

export const getObjectSlateStructureFromRawDetails = (title, rawDetails) => {
    let template = [{
        type: 'title',
        children: [{ text: title || "Title" }],
    }, {
        type: 'paragraph',
        children: [{ text: rawDetails || "" }],
    },]
    return template;
}

export const getStringSlateStructureFromRawDetails = (title, rawDetails) => {
    let o = getObjectSlateStructureFromRawDetails(title, rawDetails);
    let r = JSON.stringify(o)
    return r;
}

export const getNewPageArray = (journalId) => {
    let page = getNewPage(journalId);
    let result = [page];
    return result;
}

export const getNewPage = (journal) => {
    let result = {
        date: undefined,
        frontendId: uuid(),
        journalId: journal.id,
        content: getStringSlateStructureFromRawDetails('Page', ''),
        // content: '[{"type":"title","children":[{"text":"a3"}]},{"type":"paragraph","children":[{"text":"Add notes here"}]}]',
        contentType: 'Slate',
        subject: "Page"
    }
    return result;
}
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

export const extractLink = (data) => {
    if (typeof data === "string") {
        return data;
    }
    if (data && typeof data === "object") {
        return (
            data.url ||
            data.Url ||
            data.link ||
            data.Link ||
            data.hash ||
            data.Hash ||
            data.publicHash ||
            data.PublicHash ||
            (data.data ? extractLink(data.data) : JSON.stringify(data))
        );
    }
    return String(data);
};

export const copyTextToClipboard = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
    }
};
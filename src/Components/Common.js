import { v4 as uuid } from 'uuid';
import * as Consts from 'Consts';
import { config } from 'Consts';

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

export const extractHash = (data) => {
    if (typeof data === "string") {
        return data;
    }
    if (data && typeof data === "object") {
        return (
            data.publicHash ||
            data.PublicHash ||
            data.hash ||
            data.Hash ||
            data.url ||
            data.Url ||
            (data.data ? extractHash(data.data) : JSON.stringify(data))
        );
    }
    return String(data);
};

export const extractLink = extractHash;

export const getPagePublicUrl = (hashOrUrl) => {
    const raw = extractHash(hashOrUrl);
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
        return raw;
    }
    const cleanBase = config.PATH_BASE.endsWith("/") ? config.PATH_BASE : `${config.PATH_BASE}/`;
    return `${cleanBase}${Consts.PATH_MEETINGS_CONTROLER}/Public/${raw}`;
};

export const getJournalPublicUrl = (hashOrUrl) => {
    const raw = extractHash(hashOrUrl);
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
        return raw;
    }
    const cleanBase = config.PATH_BASE.endsWith("/") ? config.PATH_BASE : `${config.PATH_BASE}/`;
    return `${cleanBase}${Consts.PATH_TREE_CONTROLER}/Public/${raw}`;
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
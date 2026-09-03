import { v4 as uuid } from 'uuid';
import { Node } from 'slate';
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

const isBlockType = (type) => {
    if (!type) return false;
    const lower = String(type).toLowerCase();
    return [
        'p', 'paragraph', 'title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'lic', 'tr', 'table', 'blockquote',
        'code_block', 'code_line', 'check_item'
    ].includes(lower);
};

export const getPlainTextFromSlateStructure = (nodes) => {
    if (!nodes) return "";
    if (typeof nodes === "string") {
        try {
            nodes = JSON.parse(nodes);
        } catch {
            return nodes;
        }
    }
    if (!Array.isArray(nodes)) {
        nodes = [nodes];
    }

    const lines = [];
    let currentLine = "";

    const flushLine = () => {
        lines.push(currentLine.trimEnd());
        currentLine = "";
    };

    const processNode = (node) => {
        if (!node) return;

        if (Array.isArray(node)) {
            for (const child of node) {
                processNode(child);
            }
            return;
        }

        if (typeof node.text === "string") {
            currentLine += node.text;
        }

        if (Array.isArray(node.children)) {
            const isBlock = isBlockType(node.type);
            const isTableCell = node.type === "td" || node.type === "th";

            for (const child of node.children) {
                processNode(child);
                if (isTableCell) {
                    currentLine += " ";
                }
            }

            if (isBlock) {
                flushLine();
            }
        }
    };

    for (const node of nodes) {
        processNode(node);
        flushLine();
    }

    const result = [];
    let previousEmpty = false;
    for (const line of lines) {
        if (line.trim() === "") {
            if (!previousEmpty && result.length > 0) {
                result.push("");
                previousEmpty = true;
            }
        } else {
            result.push(line);
            previousEmpty = false;
        }
    }

    return result.join("\n").trim();
};

export const getNewPageArray = (journalId) => {
    let page = getNewPage(journalId);
    let result = [page];
    return result;
}

export const getNewPage = (journal) => {
    let contentObject = getObjectSlateStructureFromRawDetails('Page', '');
    let result = {
        date: undefined,
        frontendId: uuid(),
        journalId: journal.id,
        content: JSON.stringify(contentObject),
        plainText: getPlainTextFromSlateStructure(contentObject),
        contentType: 'Slate',
        subject: "Page"
    }
    return result;
}

export const getInboxNodes = (node) => {
    if (!node) return [];
    if (Array.isArray(node)) {
        let list = [];
        for (const n of node) {
            list = list.concat(getInboxNodes(n));
        }
        return list;
    }
    let list = [];
    if (node.inboxName || node.InboxName) {
        list.push(node);
    }
    if (node.nodes && Array.isArray(node.nodes)) {
        for (const child of node.nodes) {
            list = list.concat(getInboxNodes(child));
        }
    }
    return list;
};

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

export const getJournalReportUrl = (hashOrUrl) => {
    const raw = extractHash(hashOrUrl);
    if (!raw) return "";
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : config.clientRoot.replace(/\/$/, "");
    return `${origin}/raport/${raw}`;
};

export const getJournalPublicUrl = (hashOrUrl) => {
    return getJournalReportUrl(hashOrUrl);
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
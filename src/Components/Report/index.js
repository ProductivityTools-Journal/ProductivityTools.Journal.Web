import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Chip from "@mui/material/Chip";
import PrintIcon from "@mui/icons-material/Print";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArticleIcon from "@mui/icons-material/Article";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import * as apiService from "services/apiService";
import * as Common from "../Common.js";
import { toast } from "react-toastify";
import "./index.css";

import {
  Plate,
  createPlateUI,
  createPlugins,
  createBasicElementsPlugin,
  createBasicMarksPlugin,
  createHeadingPlugin,
  createBlockquotePlugin,
  createCodeBlockPlugin,
  createParagraphPlugin,
  createBoldPlugin,
  createItalicPlugin,
  createUnderlinePlugin,
  createStrikethroughPlugin,
  createCodePlugin,
  createListPlugin,
  createIndentPlugin,
  createTablePlugin,
  createLinkPlugin,
  createImagePlugin,
  createMediaEmbedPlugin,
  createSoftBreakPlugin,
  createPluginFactory,
  withProps,
  StyledElement,
} from "@udecode/plate";

const createTitlePlugin = createPluginFactory({
  key: "title",
  isElement: true,
});

const createParagraphAltPlugin = createPluginFactory({
  key: "paragraph",
  isElement: true,
});

const LinkComponent = (props) => {
  const { attributes, children, element } = props;
  return (
    <a
      {...attributes}
      href={element.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "#1976d2",
        textDecoration: "underline",
        cursor: "pointer",
        wordBreak: "break-word",
      }}
    >
      {children}
    </a>
  );
};

const reportPlateUI = createPlateUI({
  title: withProps(StyledElement, {
    as: "h1",
    styles: {
      root: {
        margin: "24px 0 6px 0",
        fontSize: "24px",
        fontWeight: "700",
        color: "#1565c0",
        borderBottom: "1px solid #e0e0e0",
        paddingBottom: "4px",
      },
    },
  }),
  paragraph: withProps(StyledElement, {
    as: "p",
    styles: {
      root: {
        margin: "4px 0",
        lineHeight: 1.6,
      },
    },
  }),
  h1: withProps(StyledElement, {
    as: "h1",
    styles: {
      root: {
        margin: "18px 0 6px 0",
        fontSize: "20px",
        fontWeight: "700",
        color: "#222",
      },
    },
  }),
  h2: withProps(StyledElement, {
    as: "h2",
    styles: {
      root: {
        margin: "14px 0 4px 0",
        fontSize: "18px",
        fontWeight: "600",
        color: "#333",
      },
    },
  }),
  code_block: withProps(StyledElement, {
    as: "pre",
    styles: {
      root: {
        backgroundColor: "#f5f5f5",
        padding: "12px 16px",
        borderRadius: "6px",
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
        fontSize: "13px",
        lineHeight: "1.45",
        overflowX: "auto",
        margin: "10px 0",
        border: "1px solid #e0e0e0",
      },
    },
  }),
  code_line: withProps(StyledElement, {
    as: "div",
    styles: {
      root: {
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
        fontSize: "13px",
        whiteSpace: "pre-wrap",
      },
    },
  }),
  lic: withProps(StyledElement, {
    as: "span",
    styles: {
      root: {
        display: "inline",
      },
    },
  }),
  a: LinkComponent,
});

const reportPlugins = createPlugins(
  [
    createBasicElementsPlugin(),
    createTitlePlugin(),
    createParagraphAltPlugin(),
    createBasicMarksPlugin(),
    createHeadingPlugin(),
    createBlockquotePlugin(),
    createCodeBlockPlugin(),
    createParagraphPlugin(),
    createBoldPlugin(),
    createItalicPlugin(),
    createUnderlinePlugin(),
    createStrikethroughPlugin(),
    createCodePlugin(),
    createListPlugin(),
    createIndentPlugin({ offset: 24, unit: "px" }),
    createTablePlugin({ options: { initialTableWidth: 600 } }),
    createLinkPlugin(),
    createImagePlugin(),
    createMediaEmbedPlugin(),
    createSoftBreakPlugin(),
  ],
  {
    components: reportPlateUI,
  }
);

function sanitizeSlateChild(node) {
  if (node === null || node === undefined) {
    return { text: "" };
  }
  if (typeof node === "string") {
    return { text: node };
  }
  if (typeof node !== "object") {
    return { text: String(node) };
  }

  // If node has 'text' property or lacks element type/children, it is a Text (leaf) node
  if (typeof node.text === "string" || (!node.type && !node.children)) {
    const cleanText = { text: typeof node.text === "string" ? node.text : "" };
    if (node.bold) cleanText.bold = true;
    if (node.italic) cleanText.italic = true;
    if (node.underline) cleanText.underline = true;
    if (node.strikethrough) cleanText.strikethrough = true;
    if (node.code) cleanText.code = true;
    return cleanText;
  }

  // Otherwise, it is an Element node (e.g. inline link <a> or nested list/element)
  return sanitizeSlateElement(node);
}

function sanitizeSlateElement(node) {
  if (!node || typeof node !== "object") {
    return { type: "p", children: [{ text: String(node || "") }] };
  }

  let nodeType = node.type || "p";
  if (nodeType === "paragraph") {
    nodeType = "p";
  }

  const rawChildren = node.children;
  let cleanChildren = [];
  if (Array.isArray(rawChildren) && rawChildren.length > 0) {
    cleanChildren = rawChildren.map(sanitizeSlateChild);
  }

  if (cleanChildren.length === 0) {
    cleanChildren = [{ text: "" }];
  }

  const cleanEl = {
    type: nodeType,
    children: cleanChildren,
  };

  if (node.url) cleanEl.url = node.url;
  if (node.target) cleanEl.target = node.target;
  if (node.lang) cleanEl.lang = node.lang;
  if (node.indent) cleanEl.indent = node.indent;
  if (node.align) cleanEl.align = node.align;
  if (node.listStyleType) cleanEl.listStyleType = node.listStyleType;

  return cleanEl;
}

function sanitizeSlateDocument(nodes) {
  if (!nodes || !Array.isArray(nodes)) {
    return [{ type: "p", children: [{ text: "" }] }];
  }
  const clean = nodes.map(sanitizeSlateElement);
  return clean.length > 0 ? clean : [{ type: "p", children: [{ text: "" }] }];
}

function parsePageBlocks(page) {
  let pageBlocks = [];
  if (page.content) {
    try {
      const parsed = JSON.parse(page.content);
      pageBlocks = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      pageBlocks = Common.getObjectSlateStructureFromRawDetails(page.subject || "Page", page.content);
    }
  } else if (page.plainText) {
    pageBlocks = Common.getObjectSlateStructureFromRawDetails(page.subject || "Page", page.plainText);
  } else {
    pageBlocks = [{ type: "p", children: [{ text: page.subject || "" }] }];
  }
  return sanitizeSlateDocument(pageBlocks);
}

export default function Report() {
  const { guid } = useParams();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("unified"); // 'unified' | 'cards'

  const loadData = useCallback(async () => {
    if (!guid) {
      setError("No report GUID provided.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getPublicTreeNotes(guid);
      if (data && Array.isArray(data)) {
        setPages(data);
      } else {
        setError("Invalid report data received.");
      }
    } catch (err) {
      console.error("Failed to load report", err);
      setError("Failed to load report from server. Please check the link or try again.");
    } finally {
      setLoading(false);
    }
  }, [guid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const reportTitle = useMemo(() => {
    if (!pages || pages.length === 0) return "Report";
    const sample = pages.find((p) => p.path);
    if (sample && sample.path) {
      const parts = sample.path.split("/").map((s) => s.trim()).filter(Boolean);
      return parts[parts.length - 1] || sample.path;
    }
    return "Report";
  }, [pages]);

  const filteredPages = useMemo(() => {
    if (!pages) return [];
    if (!searchTerm.trim()) return pages;
    const term = searchTerm.toLowerCase();
    return pages.filter((page) => {
      const subjectMatch = page.subject && page.subject.toLowerCase().includes(term);
      const pathMatch = page.path && page.path.toLowerCase().includes(term);
      const textMatch = page.plainText && page.plainText.toLowerCase().includes(term);
      return subjectMatch || pathMatch || textMatch;
    });
  }, [pages, searchTerm]);

  const unifiedPlateValue = useMemo(() => {
    if (!filteredPages || filteredPages.length === 0) {
      return [{ type: "p", children: [{ text: "No notes to display." }] }];
    }

    const combined = [];
    filteredPages.forEach((page, idx) => {
      const metaParts = [];
      if (page.path) metaParts.push(`📁 ${page.path}`);
      if (page.date) {
        const dt = new Date(page.date);
        metaParts.push(
          `📅 ${dt.toLocaleDateString("pl-PL")} ${dt.toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        );
      }

      if (metaParts.length > 0) {
        combined.push({
          type: "p",
          children: [
            {
              text: metaParts.join("   •   "),
              italic: true,
            },
          ],
        });
      }

      const blocks = parsePageBlocks(page);
      combined.push(...blocks);

      if (idx < filteredPages.length - 1) {
        combined.push({
          type: "p",
          children: [{ text: "──────────────────────────────────────────────────" }],
        });
        combined.push({
          type: "p",
          children: [{ text: "" }],
        });
      }
    });

    return combined;
  }, [filteredPages]);

  const handleCopyAll = async () => {
    if (!filteredPages || filteredPages.length === 0) return;
    const allText = filteredPages
      .map((p) => {
        const header = `=== ${p.subject || "Page"} [${p.path || ""}] (${p.date || ""}) ===\n`;
        const body = p.plainText || Common.getPlainTextFromSlateStructure(p.content);
        return `${header}${body}\n`;
      })
      .join("\n\n");

    await Common.copyTextToClipboard(allText);
    toast.success("All notes copied to clipboard!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-page-container">
      <div className="report-header no-print">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Button
            component={Link}
            to="/"
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            sx={{ textDecoration: "none" }}
          >
            Home
          </Button>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1976d2", lineHeight: 1.2 }}>
              {reportTitle}
            </Typography>
            <Typography variant="caption" sx={{ color: "#666" }}>
              Public Report • {pages.length} {pages.length === 1 ? "note" : "notes"}
            </Typography>
          </Box>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Filter in report..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ minWidth: 200 }}
          />

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, next) => next && setViewMode(next)}
            size="small"
            aria-label="view mode"
          >
            <ToggleButton value="unified" title="Continuous Document">
              <ArticleIcon fontSize="small" sx={{ mr: 0.5 }} /> Document
            </ToggleButton>
            <ToggleButton value="cards" title="Separate Note Cards">
              <ViewAgendaIcon fontSize="small" sx={{ mr: 0.5 }} /> Cards
            </ToggleButton>
          </ToggleButtonGroup>

          <Tooltip title="Copy all plain text">
            <IconButton color="primary" onClick={handleCopyAll} size="small">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print / PDF
          </Button>
        </div>
      </div>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
          <CircularProgress />
        </Box>
      )}

      {error && !loading && (
        <Box sx={{ maxWidth: 600, margin: "60px auto", textAlign: "center", p: 3 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Error loading report
          </Typography>
          <Typography color="text.secondary" paragraph>
            {error}
          </Typography>
          <Button variant="contained" onClick={loadData}>
            Try Again
          </Button>
        </Box>
      )}

      {!loading && !error && (
        <>
          {viewMode === "unified" ? (
            <div className="report-document-paper report-plate-editor">
              <Plate
                key={`unified-${filteredPages.length}-${searchTerm}`}
                initialValue={unifiedPlateValue}
                value={unifiedPlateValue}
                plugins={reportPlugins}
                readOnly={true}
              />
            </div>
          ) : (
            <Box sx={{ maxWidth: 960, margin: "28px auto", px: 2 }}>
              {filteredPages.map((page) => {
                const noteBlocks = parsePageBlocks(page);
                const dt = page.date ? new Date(page.date) : null;
                return (
                  <div key={page.pageId} className="report-note-card report-plate-editor">
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1.5,
                        pb: 1,
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          icon={<ArticleIcon />}
                          label={page.path || "Note"}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      {dt && (
                        <Typography variant="caption" sx={{ color: "#888" }}>
                          {dt.toLocaleDateString("pl-PL")} {dt.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                      )}
                    </Box>
                    <Plate
                      key={`card-${page.pageId}`}
                      initialValue={noteBlocks}
                      value={noteBlocks}
                      plugins={reportPlugins}
                      readOnly={true}
                    />
                  </div>
                );
              })}
            </Box>
          )}
        </>
      )}
    </div>
  );
}

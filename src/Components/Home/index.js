import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ClearIcon from "@mui/icons-material/Clear";
import CloudSyncOutlinedIcon from "@mui/icons-material/CloudSyncOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GridViewIcon from "@mui/icons-material/GridView";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PushPinIcon from "@mui/icons-material/PushPin";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ViewAgendaOutlinedIcon from "@mui/icons-material/ViewAgendaOutlined";
import * as moment from "moment";
import { useAuthState } from "react-firebase-hooks/auth";
import * as apiService from "services/apiService";
import offlineService from "services/offlineService";
import { auth, logout } from "../../Session/firebase";
import { useAuth } from "../../Session/AuthContext";
import * as Common from "../Common";
import "./index.css";

const BRANCH_COLORS = [
  "#1976d2",
  "#00897b",
  "#ef6c00",
  "#2e7d32",
  "#5c6bc0",
  "#c2185b",
  "#6d4c41",
  "#00838f",
];

const PL_MONTHS_SHORT = [
  "Sty",
  "Lut",
  "Mar",
  "Kwi",
  "Maj",
  "Cze",
  "Lip",
  "Sie",
  "Wrz",
  "Paź",
  "Lis",
  "Gru",
];

const PL_WEEKDAYS_FULL = [
  "Niedziela",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
];

const HEATMAP_ROW_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
const GRID_MODE_STORAGE_KEY = "journalHomeGridMode";

/**
 * Bruls–Huizing–van Wijk Squarified Treemap layout algorithm (used in WinDirStat / SequoiaView).
 */
function squarifyTreemap(items, rect) {
  const valid = (items || [])
    .filter((it) => it && it.value > 0)
    .sort((a, b) => b.value - a.value);

  if (valid.length === 0 || rect.w <= 0 || rect.h <= 0) {
    return [];
  }

  const total = valid.reduce((sum, it) => sum + it.value, 0);
  if (total <= 0) return [];

  const scale = (rect.w * rect.h) / total;
  const scaled = valid.map((it) => ({ ...it, area: it.value * scale }));

  const results = [];
  let free = { ...rect };
  let row = [];

  const worstAspect = (candidateRow, side) => {
    if (candidateRow.length === 0 || side <= 0) return Infinity;
    let sum = 0;
    let minA = Infinity;
    let maxA = 0;
    for (const r of candidateRow) {
      sum += r.area;
      if (r.area < minA) minA = r.area;
      if (r.area > maxA) maxA = r.area;
    }
    if (sum <= 0 || minA <= 0) return Infinity;
    const s2 = sum * sum;
    const l2 = side * side;
    return Math.max((l2 * maxA) / s2, s2 / (l2 * minA));
  };

  const layoutRow = (rowItems) => {
    const sum = rowItems.reduce((s, x) => s + x.area, 0);
    if (free.w >= free.h) {
      const colW = free.h > 0 ? sum / free.h : 0;
      let cy = free.y;
      for (const item of rowItems) {
        const rh = colW > 0 ? item.area / colW : 0;
        results.push({ ...item, x: free.x, y: cy, w: colW, h: rh });
        cy += rh;
      }
      free = {
        x: free.x + colW,
        y: free.y,
        w: Math.max(0, free.w - colW),
        h: free.h,
      };
    } else {
      const rowH = free.w > 0 ? sum / free.w : 0;
      let cx = free.x;
      for (const item of rowItems) {
        const rw = rowH > 0 ? item.area / rowH : 0;
        results.push({ ...item, x: cx, y: free.y, w: rw, h: rowH });
        cx += rw;
      }
      free = {
        x: free.x,
        y: free.y + rowH,
        w: free.w,
        h: Math.max(0, free.h - rowH),
      };
    }
  };

  for (const item of scaled) {
    if (row.length === 0) {
      row.push(item);
    } else {
      const side = Math.min(free.w, free.h);
      if (worstAspect([...row, item], side) <= worstAspect(row, side)) {
        row.push(item);
      } else {
        layoutRow(row);
        row = [item];
      }
    }
  }

  if (row.length > 0) {
    layoutRow(row);
  }

  return results;
}

function analyzeJournalTree(treeData) {
  const nodeMap = new Map();
  let totalFolders = 0;

  if (!treeData) {
    return { nodeMap, totalFolders, rootNode: null, rootList: [] };
  }

  const rootList = Array.isArray(treeData) ? treeData : [treeData];
  const primaryRoot = rootList[0] || null;

  const traverse = (node, pathParts) => {
    if (!node || node.id == null) return new Set();
    totalFolders += 1;

    const idNum = Number(node.id);
    const nameStr = node.name || `Folder #${idNum}`;
    const nextPath = [...pathParts, nameStr];
    const subtreeIds = new Set([idNum]);

    const childNodes = Array.isArray(node.nodes) ? node.nodes : [];
    const childIds = [];

    for (const child of childNodes) {
      if (child && child.id != null) {
        childIds.push(Number(child.id));
        const childSubtree = traverse(child, nextPath);
        childSubtree.forEach((cid) => subtreeIds.add(cid));
      }
    }

    nodeMap.set(idNum, {
      id: idNum,
      name: nameStr,
      parentId: node.parentId != null ? Number(node.parentId) : null,
      path: nextPath.join(" >> "),
      pathParts: nextPath,
      childIds,
      subtreeIds,
    });

    return subtreeIds;
  };

  for (const r of rootList) {
    traverse(r, []);
  }

  return { nodeMap, totalFolders, rootNode: primaryRoot, rootList };
}

function collectImageUrls(nodes, out = []) {
  if (!nodes) return out;
  if (Array.isArray(nodes)) {
    for (const n of nodes) collectImageUrls(n, out);
    return out;
  }
  if (typeof nodes === "object") {
    const t = String(nodes.type || "").toLowerCase();
    if ((t === "img" || t === "image") && typeof nodes.url === "string" && nodes.url) {
      out.push(nodes.url);
    }
    if (Array.isArray(nodes.children)) {
      collectImageUrls(nodes.children, out);
    }
  }
  return out;
}

function extractNotePresentation(page) {
  let firstLine = "";
  let restBody = "";
  const imageUrls = [];

  if (page?.content) {
    try {
      const parsed = JSON.parse(page.content);
      const blocks = Array.isArray(parsed) ? parsed : [parsed];
      collectImageUrls(blocks, imageUrls);
      if (blocks.length > 0) {
        firstLine = Common.getPlainTextFromSlateStructure([blocks[0]]).trim();
        if (blocks.length > 1) {
          restBody = Common.getPlainTextFromSlateStructure(blocks.slice(1)).trim();
        }
      }
    } catch (_e) {
      const raw = String(page.content).trim();
      const lines = raw.split(/\r?\n/);
      firstLine = (lines[0] || "").trim();
      restBody = lines.slice(1).join("\n").trim();
    }
  }

  if (!firstLine && !restBody && page?.plainText) {
    const lines = String(page.plainText)
      .split(/\r?\n/)
      .map((l) => l.trimEnd());
    const firstNonEmptyIdx = lines.findIndex((l) => l.trim() !== "");
    if (firstNonEmptyIdx !== -1) {
      firstLine = lines[firstNonEmptyIdx].trim();
      restBody = lines
        .slice(firstNonEmptyIdx + 1)
        .join("\n")
        .trim();
    }
  }

  const cleanSubject =
    page?.subject && page.subject.trim() && page.subject.trim() !== "Page"
      ? page.subject.trim()
      : "";

  let title = firstLine;
  if (!title || title === "Page" || title === "Title") {
    title = cleanSubject || firstLine || "Notatka bez tytułu";
  }

  let preview = restBody;
  if (!preview && cleanSubject && cleanSubject !== title) {
    preview = cleanSubject;
  }

  return {
    title,
    preview,
    hasBody: Boolean(preview),
    firstImageUrl: imageUrls[0] || null,
    imageCount: imageUrls.length,
  };
}

function toDateKey(dateInput) {
  if (!dateInput) return null;
  const m = moment(dateInput);
  if (!m.isValid()) return null;
  return m.format("YYYY-MM-DD");
}

function getHeatmapColor(count) {
  if (!count || count <= 0) return "#ebedf0";
  if (count === 1) return "#bbdefb";
  if (count === 2) return "#64b5f6";
  if (count <= 4) return "#1e88e5";
  return "#0d47a1";
}

export default function Home() {
  const navigate = useNavigate();
  const { user: contextUser } = useAuth();
  const [firebaseUser, authLoading] = useAuthState(auth);

  const [treeData, setTreeData] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offlineState, setOfflineState] = useState(() => offlineService.getState());

  const [gridMode, setGridMode] = useState(() => {
    const saved = localStorage.getItem(GRID_MODE_STORAGE_KEY);
    return saved === "single" ? "single" : "two";
  });

  const [zoomedNodeId, setZoomedNodeId] = useState(null);
  const [hoveredTile, setHoveredTile] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState({});
  const [visibleLimit, setVisibleLimit] = useState(16);

  const treemapCanvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 680, h: 236 });

  useEffect(() => {
    const unsub = offlineService.subscribe((st) => setOfflineState(st));
    return unsub;
  }, []);

  useEffect(() => {
    const el = treemapCanvasRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setCanvasSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
      }
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => updateSize());
      observer.observe(el);
      return () => observer.disconnect();
    } else {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }
  }, [loading, pages.length]);

  const hasSession = Boolean(
    firebaseUser ||
      contextUser ||
      (typeof localStorage !== "undefined" && localStorage.getItem("token"))
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tree = await apiService.getTree(false);
      setTreeData(tree);

      const rootNode = Array.isArray(tree) ? tree[0] : tree;
      if (!rootNode || rootNode.id == null) {
        setPages([]);
        setLoading(false);
        return;
      }

      const freshPages = (await apiService.fetchPageList(rootNode.id)) || [];
      let cachedPages = [];
      try {
        cachedPages = (await offlineService.getCachedPagesForSubtree(rootNode.id)) || [];
      } catch (_cacheErr) {
        cachedPages = [];
      }

      const mergedMap = new Map();
      for (const cp of cachedPages) {
        if (cp && !cp.Deleted && cp.pageId != null) {
          mergedMap.set(Number(cp.pageId), cp);
        }
      }
      for (const fp of freshPages) {
        if (fp && !fp.Deleted && fp.pageId != null) {
          const pid = Number(fp.pageId);
          const existing = mergedMap.get(pid);
          if (!existing || !existing.isOfflinePending) {
            mergedMap.set(pid, fp);
          }
        }
      }

      setPages(Array.from(mergedMap.values()));
    } catch (err) {
      console.error("Failed to load home dashboard:", err);
      setError("Nie udało się pobrać ostatnich notatek. Sprawdź połączenie lub zaloguj się ponownie.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    if (authLoading && !isOffline) {
      return;
    }
    if (!hasSession && !isOffline) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [authLoading, firebaseUser?.uid, hasSession, loadDashboard]);

  useEffect(() => {
    const unsub = offlineService.onDataRefreshed(() => {
      loadDashboard();
    });
    return unsub;
  }, [loadDashboard]);

  const handleLogout = () => {
    logout();
    navigate("/Login");
  };

  const handleGridModeChange = (_e, nextMode) => {
    if (!nextMode) return;
    setGridMode(nextMode);
    localStorage.setItem(GRID_MODE_STORAGE_KEY, nextMode);
  };

  const toggleDateFilter = (dateStr) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
    setVisibleLimit(16);
  };

  const toggleFolderFilter = (folderId) => {
    const idNum = Number(folderId);
    setSelectedFolderId((prev) => (prev === idNum ? null : idNum));
    setVisibleLimit(16);
  };

  const clearAllFilters = () => {
    setSelectedDate(null);
    setSelectedFolderId(null);
    setPinnedOnly(false);
    setSearchQuery("");
    setVisibleLimit(16);
  };

  const toggleExpandCard = (pageId) => {
    setExpandedIds((prev) => ({
      ...prev,
      [pageId]: !prev[pageId],
    }));
  };

  const openNoteInTree = (journalId, pageId) => {
    if (journalId == null) {
      navigate("/List");
      return;
    }
    const params = new URLSearchParams();
    params.set("treeId", String(journalId));
    if (pageId != null) {
      params.set("pageId", String(pageId));
    }
    navigate(`/List?${params.toString()}`);
  };

  const openInboxNewNote = (inboxNode) => {
    if (!inboxNode?.id) return;
    const params = new URLSearchParams();
    params.set("treeId", String(inboxNode.id));
    params.set("newNote", "1");
    navigate(`/List?${params.toString()}`);
  };

  const handleSyncFullTree = async () => {
    try {
      await apiService.syncAllForOffline();
    } catch (_err) {
      // Handled by statusService
    }
  };

  const { nodeMap, totalFolders, rootNode, rootList } = useMemo(
    () => analyzeJournalTree(treeData),
    [treeData]
  );

  const inboxNodes = useMemo(() => Common.getInboxNodes(treeData), [treeData]);

  // Enrich and sort all loaded pages newest-first
  const enrichedPages = useMemo(() => {
    if (!pages || pages.length === 0) return [];
    const list = pages.map((p) => {
      const jid = p.journalId != null ? Number(p.journalId) : null;
      const nodeInfo = jid != null ? nodeMap.get(jid) : null;
      const { title, preview, hasBody, firstImageUrl, imageCount } = extractNotePresentation(p);
      const dateKey = toDateKey(p.date);
      const timestamp = p.date ? new Date(p.date).getTime() : 0;

      return {
        ...p,
        journalIdNum: jid,
        title,
        preview,
        hasBody,
        firstImageUrl,
        imageCount,
        dateKey,
        timestamp: Number.isNaN(timestamp) ? 0 : timestamp,
        path: nodeInfo?.path || p.path || "Journal",
      };
    });

    list.sort((a, b) => b.timestamp - a.timestamp);
    return list;
  }, [pages, nodeMap]);

  // Direct folder note counts per exact journalId
  const directFolderCounts = useMemo(() => {
    const counts = new Map();
    for (const p of enrichedPages) {
      if (p.journalIdNum == null) continue;
      counts.set(p.journalIdNum, (counts.get(p.journalIdNum) || 0) + 1);
    }
    return counts;
  }, [enrichedPages]);

  // Build two-level hierarchical WinDirStat Cushion Treemap geometry (by note count)
  const treemapLayout = useMemo(() => {
    const W = canvasSize.w;
    const H = canvasSize.h;
    if (W <= 0 || H <= 0 || enrichedPages.length === 0 || nodeMap.size === 0) {
      return { branchRects: [], grandTotal: 0, activeFolderCount: 0, zoomedNode: null };
    }

    const activeFolderCount = directFolderCounts.size;

    // Determine current container node for drill-down (or default root)
    let containerNode = null;
    if (zoomedNodeId != null && nodeMap.has(Number(zoomedNodeId))) {
      containerNode = nodeMap.get(Number(zoomedNodeId));
    } else if (rootList.length === 1 && rootNode?.id != null) {
      containerNode = nodeMap.get(Number(rootNode.id)) || null;
    }

    // Determine group roots under containerNode
    let groupSpecs = [];
    if (containerNode) {
      for (const cid of containerNode.childIds) {
        const cNode = nodeMap.get(cid);
        if (cNode) {
          groupSpecs.push({
            groupKey: `branch-${cNode.id}`,
            nodeId: cNode.id,
            name: cNode.name,
            canZoom: cNode.childIds.length > 0,
            memberIds: cNode.subtreeIds,
          });
        }
      }
      // Direct notes sitting directly on containerNode itself
      if (directFolderCounts.has(containerNode.id)) {
        groupSpecs.push({
          groupKey: `direct-${containerNode.id}`,
          nodeId: containerNode.id,
          name: `${containerNode.name} (bezpośrednie)`,
          canZoom: false,
          memberIds: new Set([containerNode.id]),
        });
      }
    } else {
      for (const r of rootList) {
        if (r && r.id != null) {
          const rNode = nodeMap.get(Number(r.id));
          if (rNode) {
            groupSpecs.push({
              groupKey: `branch-${rNode.id}`,
              nodeId: rNode.id,
              name: rNode.name,
              canZoom: rNode.childIds.length > 0,
              memberIds: rNode.subtreeIds,
            });
          }
        }
      }
    }

    const populatedGroups = [];
    let colorIdx = 0;

    for (const g of groupSpecs) {
      const leafFolders = [];
      let groupCount = 0;

      g.memberIds.forEach((fid) => {
        const noteCount = directFolderCounts.get(fid) || 0;
        if (noteCount > 0) {
          const fNode = nodeMap.get(fid);
          let shortLabel = fNode?.name || `#${fid}`;
          if (fNode && fNode.id !== g.nodeId && fNode.pathParts.length > 2) {
            const gNode = nodeMap.get(g.nodeId);
            const prefixLen = gNode ? gNode.pathParts.length : 0;
            const rel = fNode.pathParts.slice(prefixLen).join(" / ");
            if (rel) shortLabel = rel;
          }

          leafFolders.push({
            folderId: fid,
            name: shortLabel,
            fullPath: fNode?.path || shortLabel,
            count: noteCount,
            value: noteCount,
            hasChildren: Boolean(fNode && fNode.childIds.length > 0),
          });
          groupCount += noteCount;
        }
      });

      if (leafFolders.length > 0) {
        const color = BRANCH_COLORS[colorIdx % BRANCH_COLORS.length];
        colorIdx += 1;
        populatedGroups.push({
          ...g,
          color,
          count: groupCount,
          value: groupCount,
          leafFolders,
        });
      }
    }

    const grandTotal = populatedGroups.reduce((s, g) => s + g.value, 0);
    const outerRects = squarifyTreemap(populatedGroups, { x: 0, y: 0, w: W, h: H });

    const branchRects = outerRects.map((br) => {
      const showHeader = br.w >= 74 && br.h >= 44;
      const headerH = showHeader ? 19 : 2;
      const pad = 2;
      const innerRect = {
        x: br.x + pad,
        y: br.y + headerH,
        w: Math.max(0, br.w - pad * 2),
        h: Math.max(0, br.h - headerH - pad),
      };
      const tiles = squarifyTreemap(br.leafFolders, innerRect);
      return {
        ...br,
        showHeader,
        headerH,
        tiles,
      };
    });

    return {
      branchRects,
      grandTotal,
      activeFolderCount,
      zoomedNode: zoomedNodeId != null ? nodeMap.get(Number(zoomedNodeId)) || null : null,
    };
  }, [
    canvasSize.w,
    canvasSize.h,
    enrichedPages.length,
    nodeMap,
    directFolderCounts,
    zoomedNodeId,
    rootList,
    rootNode,
  ]);

  // Counts by YYYY-MM-DD across all loaded notes
  const countsByDate = useMemo(() => {
    const map = new Map();
    for (const p of enrichedPages) {
      if (p.dateKey) {
        map.set(p.dateKey, (map.get(p.dateKey) || 0) + 1);
      }
    }
    return map;
  }, [enrichedPages]);

  // 18-week Regularity Calendar + month headers + streak & weekday insights
  const regularityData = useMemo(() => {
    const today = moment().startOf("day");
    const currentIsoDow = today.isoWeekday(); // 1 (Mon) .. 7 (Sun)
    const endOfCurrentWeek = today.clone().add(7 - currentIsoDow, "days");
    const totalWeeks = 18;
    const startMonday = endOfCurrentWeek.clone().subtract(totalWeeks * 7 - 1, "days");

    const weeks = [];
    const monthLabels = [];
    let lastMonth = -1;
    let totalInWindow = 0;
    let activeDaysInWindow = 0;
    const dowTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun..Sat

    for (let w = 0; w < totalWeeks; w++) {
      const days = [];
      const firstDayOfWeek = startMonday.clone().add(w * 7, "days");
      const mIdx = firstDayOfWeek.month();
      if (mIdx !== lastMonth) {
        monthLabels.push(PL_MONTHS_SHORT[mIdx]);
        lastMonth = mIdx;
      } else {
        monthLabels.push("");
      }

      for (let d = 0; d < 7; d++) {
        const cellMoment = startMonday.clone().add(w * 7 + d, "days");
        const key = cellMoment.format("YYYY-MM-DD");
        const isFuture = cellMoment.isAfter(today, "day");
        const cnt = isFuture ? 0 : countsByDate.get(key) || 0;

        if (!isFuture) {
          totalInWindow += cnt;
          if (cnt > 0) {
            activeDaysInWindow += 1;
            dowTotals[cellMoment.day()] += cnt;
          }
        }

        days.push({
          date: key,
          label: `${cellMoment.format("YYYY.MM.DD")} (${HEATMAP_ROW_LABELS[d]})`,
          count: cnt,
          isFuture,
        });
      }
      weeks.push(days);
    }

    // Current consecutive daily streak (today or starting from yesterday)
    let streak = 0;
    let cursor = today.clone();
    if ((countsByDate.get(cursor.format("YYYY-MM-DD")) || 0) === 0) {
      cursor.subtract(1, "days");
    }
    while ((countsByDate.get(cursor.format("YYYY-MM-DD")) || 0) > 0) {
      streak += 1;
      cursor.subtract(1, "days");
    }

    // Most active day of week
    let bestDowIdx = -1;
    let bestDowVal = 0;
    for (let i = 0; i < 7; i++) {
      if (dowTotals[i] > bestDowVal) {
        bestDowVal = dowTotals[i];
        bestDowIdx = i;
      }
    }

    // Last 14d & 7d counts for KPI strip
    let count14d = 0;
    let count7d = 0;
    for (let i = 0; i < 14; i++) {
      const k = today.clone().subtract(i, "days").format("YYYY-MM-DD");
      const c = countsByDate.get(k) || 0;
      count14d += c;
      if (i < 7) count7d += c;
    }

    return {
      weeks,
      monthLabels,
      totalInWindow,
      activeDaysInWindow,
      streak,
      bestWeekday: bestDowIdx >= 0 ? PL_WEEKDAYS_FULL[bestDowIdx] : "—",
      count14d,
      count7d,
    };
  }, [countsByDate]);

  const summaryStats = useMemo(() => {
    const latest = enrichedPages[0] || null;
    const latestMoment = latest?.date ? moment(latest.date) : null;
    const pinnedCount = enrichedPages.filter((p) => Boolean(p.pinned)).length;

    return {
      pinnedCount,
      latestFormatted:
        latestMoment && latestMoment.isValid()
          ? latestMoment.isSame(moment(), "day")
            ? `Dzisiaj, ${latestMoment.format("HH:mm")}`
            : latestMoment.format("YYYY.MM.DD HH:mm")
          : "Brak wpisów",
      latestRelative:
        latestMoment && latestMoment.isValid() ? latestMoment.fromNow() : "—",
    };
  }, [enrichedPages]);

  const selectedFolderNode = useMemo(
    () => (selectedFolderId != null ? nodeMap.get(Number(selectedFolderId)) || null : null),
    [nodeMap, selectedFolderId]
  );

  // Filtered Recent Notes
  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return enrichedPages.filter((p) => {
      if (selectedDate && p.dateKey !== selectedDate) return false;
      if (selectedFolderNode) {
        if (p.journalIdNum == null || !selectedFolderNode.subtreeIds.has(p.journalIdNum)) {
          return false;
        }
      } else if (selectedFolderId != null) {
        if (p.journalIdNum !== Number(selectedFolderId)) return false;
      }
      if (pinnedOnly && !p.pinned) return false;
      if (query) {
        const hayTitle = (p.title || "").toLowerCase();
        const hayPreview = (p.preview || "").toLowerCase();
        const hayPath = (p.path || "").toLowerCase();
        if (
          !hayTitle.includes(query) &&
          !hayPreview.includes(query) &&
          !hayPath.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [enrichedPages, selectedDate, selectedFolderNode, selectedFolderId, pinnedOnly, searchQuery]);

  const renderTopBar = () => (
    <header className="home-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <Link to="/" className="home-brand">
          <span className="home-brand-badge">J</span>
          <span>Journal</span>
        </Link>

        {inboxNodes &&
          inboxNodes.map((inboxNode) => (
            <Button
              key={inboxNode.id}
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => openInboxNewNote(inboxNode)}
            >
              {inboxNode.inboxName || inboxNode.InboxName}
            </Button>
          ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        {hasSession && (
          <Tooltip title="Odśwież ostatnie notatki i diagramy">
            <span>
              <IconButton
                size="small"
                color="primary"
                onClick={loadDashboard}
                disabled={loading}
                aria-label="Odśwież dane"
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}

        <Button
          component={Link}
          to="/List"
          variant="contained"
          color="primary"
          size="small"
          startIcon={<AccountTreeOutlinedIcon fontSize="small" />}
          sx={{ textDecoration: "none", fontWeight: 600 }}
        >
          Otwórz Drzewo Notatek
        </Button>

        {hasSession ? (
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<LogoutIcon fontSize="small" />}
            onClick={handleLogout}
            sx={{ color: "#555", borderColor: "#d0d7de" }}
          >
            Wyloguj
          </Button>
        ) : (
          <Button
            component={Link}
            to="/Login"
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<LoginIcon fontSize="small" />}
          >
            Zaloguj
          </Button>
        )}
      </div>
    </header>
  );

  if (!authLoading && !hasSession && (typeof navigator === "undefined" || navigator.onLine)) {
    return (
      <div className="home-page">
        {renderTopBar()}
        <Box
          sx={{
            maxWidth: 480,
            margin: "80px auto",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
            p: 4,
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: "#1f2937" }}>
            Witaj w ProductivityTools Journal
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b778c", mb: 3 }}>
            Zaloguj się, aby zobaczyć mapę drzewa notatek, kalendarz regularności oraz ostatnie wpisy.
          </Typography>
          <Button
            component={Link}
            to="/Login"
            variant="contained"
            color="primary"
            startIcon={<LoginIcon />}
          >
            Przejdź do logowania
          </Button>
        </Box>
      </div>
    );
  }

  const renderRegularityCalendar = () => (
    <div className="home-card">
      <div className="home-card-header">
        <div>
          <h2 className="home-card-title">Kalendarz regularności</h2>
          <p className="home-card-subtitle">
            Ostatnie 18 tygodni — kliknij kratkę dnia, aby filtrować notatki
          </p>
        </div>
        <span className="home-card-badge">
          {regularityData.totalInWindow}{" "}
          {regularityData.totalInWindow === 1 ? "wpis" : "wpisów"} / 18 tyg.
        </span>
      </div>

      <div className="home-heatmap-scroll">
        <div className="home-heatmap-wrap">
          <div className="home-heatmap-months">
            {regularityData.monthLabels.map((mLbl, idx) => (
              <span key={idx} className="home-heatmap-month-cell">
                {mLbl}
              </span>
            ))}
          </div>

          <div className="home-heatmap-body">
            <div className="home-heatmap-days">
              {HEATMAP_ROW_LABELS.map((lbl, idx) => (
                <span key={lbl} className="home-heatmap-day-lbl">
                  {idx % 2 === 0 ? lbl : ""}
                </span>
              ))}
            </div>

            <div className="home-heatmap-cols">
              {regularityData.weeks.map((week, wIdx) => (
                <div key={wIdx} className="home-heatmap-col">
                  {week.map((cell) => {
                    if (cell.isFuture) {
                      return (
                        <span
                          key={cell.date}
                          className="home-heatmap-cell home-heatmap-cell--future"
                        />
                      );
                    }
                    const isSelected = selectedDate === cell.date;
                    return (
                      <Tooltip
                        key={cell.date}
                        title={`${cell.label}: ${cell.count} ${
                          cell.count === 1 ? "notatka" : "notatek"
                        }`}
                        arrow
                      >
                        <button
                          type="button"
                          onClick={() => toggleDateFilter(cell.date)}
                          className={`home-heatmap-cell ${
                            isSelected ? "home-heatmap-cell--selected" : ""
                          }`}
                          style={{ backgroundColor: getHeatmapColor(cell.count) }}
                          aria-label={`${cell.label}: ${cell.count}`}
                        />
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="home-heatmap-footer">
        <span>
          Najaktywniejszy dzień: <strong style={{ color: "#1f2937" }}>{regularityData.bestWeekday}</strong>
        </span>
        <div className="home-heatmap-scale">
          <span>Mniej</span>
          {[0, 1, 2, 3, 5].map((lvl) => (
            <span
              key={lvl}
              className="home-heatmap-swatch"
              style={{ backgroundColor: getHeatmapColor(lvl) }}
            />
          ))}
          <span>Więcej</span>
        </div>
      </div>
    </div>
  );

  const renderWinDirStatTreemap = () => {
    const { branchRects, grandTotal, zoomedNode } = treemapLayout;

    const handleZoomUp = () => {
      if (!zoomedNode) return;
      const parentId = zoomedNode.parentId;
      if (
        parentId == null ||
        parentId === zoomedNode.id ||
        (rootList.length === 1 && rootNode && Number(parentId) === Number(rootNode.id))
      ) {
        setZoomedNodeId(null);
      } else {
        setZoomedNodeId(parentId);
      }
    };

    let statusElement = null;
    if (hoveredTile) {
      const pct =
        grandTotal > 0 ? ((hoveredTile.count / grandTotal) * 100).toFixed(1) : "0.0";
      statusElement = (
        <span>
          <strong style={{ color: "#1f2937" }}>{hoveredTile.fullPath}</strong> —{" "}
          {hoveredTile.count} {hoveredTile.count === 1 ? "notatka" : "notatek"} ({pct}%)
        </span>
      );
    } else if (selectedFolderNode) {
      statusElement = (
        <span>
          Wybrany folder: <strong style={{ color: "#1565c0" }}>{selectedFolderNode.path}</strong>
        </span>
      );
    } else {
      statusElement = (
        <span>
          Najedź na blok, aby podejrzeć ścieżkę • Kliknij: filtruj • Kliknij nagłówek gałęzi: przybliż
        </span>
      );
    }

    const isPartialHistory = !offlineState.lastFullSyncAt && enrichedPages.length >= 50;

    return (
      <div className="home-card">
        <div className="home-card-header">
          <div>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <h2 className="home-card-title">
                Mapa drzewa notatek{zoomedNode ? `: ${zoomedNode.name}` : ""}
              </h2>
              {zoomedNode && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ArrowBackIcon sx={{ fontSize: "14px !important" }} />}
                  onClick={handleZoomUp}
                  sx={{ height: 22, fontSize: "0.72rem", px: 1 }}
                >
                  Wyżej
                </Button>
              )}
              {zoomedNode && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setZoomedNodeId(null)}
                  sx={{ height: 22, fontSize: "0.72rem", px: 0.75 }}
                >
                  Całe drzewo
                </Button>
              )}
            </Box>
            <p className="home-card-subtitle">
              Rozkład folderów wg liczby notatek (styl WinDirStat)
            </p>
          </div>

          <span className="home-card-badge">
            {grandTotal} {grandTotal === 1 ? "notatka" : "notatek"}
          </span>
        </div>

        <div ref={treemapCanvasRef} className="home-treemap-canvas">
          {branchRects.length === 0 ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6b778c",
                fontSize: "0.82rem",
              }}
            >
              Brak notatek do zbudowania mapy drzewa
            </Box>
          ) : (
            branchRects.map((br) => (
              <React.Fragment key={br.groupKey}>
                <div
                  className="home-treemap-branch-box"
                  style={{
                    left: `${br.x}px`,
                    top: `${br.y}px`,
                    width: `${br.w}px`,
                    height: `${br.h}px`,
                    backgroundColor: `${br.color}24`,
                  }}
                >
                  {br.showHeader && (
                    <div
                      className="home-treemap-branch-header"
                      style={{ height: `${br.headerH}px`, backgroundColor: br.color }}
                      onClick={() => {
                        if (br.canZoom) {
                          setZoomedNodeId(br.nodeId);
                        } else {
                          toggleFolderFilter(br.nodeId);
                        }
                      }}
                      title={
                        br.canZoom
                          ? `Kliknij, aby przybliżyć gałąź „${br.name}”`
                          : `Filtruj wg „${br.name}”`
                      }
                    >
                      <span className="home-treemap-branch-title">{br.name}</span>
                      <span className="home-treemap-branch-val">{br.count}</span>
                    </div>
                  )}
                </div>

                {br.tiles.map((tile) => {
                  const isSelected = selectedFolderId === tile.folderId;
                  const isDimmed =
                    selectedFolderId != null &&
                    !isSelected &&
                    !(selectedFolderNode?.subtreeIds?.has(tile.folderId));
                  const canShowTitle = tile.w >= 46 && tile.h >= 22;
                  const canShowVal = tile.w >= 60 && tile.h >= 38;

                  return (
                    <button
                      key={`${br.groupKey}-${tile.folderId}`}
                      type="button"
                      className={`home-treemap-tile ${
                        isSelected ? "home-treemap-tile--selected" : ""
                      }`}
                      style={{
                        left: `${tile.x + 0.75}px`,
                        top: `${tile.y + 0.75}px`,
                        width: `${Math.max(0, tile.w - 1.5)}px`,
                        height: `${Math.max(0, tile.h - 1.5)}px`,
                        backgroundColor: br.color,
                        opacity: isDimmed ? 0.42 : 1,
                      }}
                      onClick={() => toggleFolderFilter(tile.folderId)}
                      onDoubleClick={() => {
                        if (tile.hasChildren) {
                          setZoomedNodeId(tile.folderId);
                        } else if (br.canZoom) {
                          setZoomedNodeId(br.nodeId);
                        }
                      }}
                      onMouseEnter={() => setHoveredTile(tile)}
                      onMouseLeave={() => setHoveredTile(null)}
                      aria-label={`${tile.fullPath}: ${tile.count} notatek`}
                    >
                      {canShowTitle && (
                        <span className="home-treemap-tile-name">{tile.name}</span>
                      )}
                      {canShowVal && (
                        <span className="home-treemap-tile-val">{tile.count} not.</span>
                      )}
                    </button>
                  );
                })}
              </React.Fragment>
            ))
          )}
        </div>

        <div className="home-treemap-statusbar">
          <div className="home-treemap-status-text">{statusElement}</div>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            {selectedFolderNode && (
              <Button
                size="small"
                variant="text"
                endIcon={<OpenInNewIcon sx={{ fontSize: "14px !important" }} />}
                onClick={() => openNoteInTree(selectedFolderNode.id, null)}
                sx={{ p: 0, minWidth: 0, fontSize: "0.74rem", fontWeight: 600 }}
              >
                Otwórz w drzewie
              </Button>
            )}

            {isPartialHistory && offlineState.isOnline && (
              <Tooltip title="Pobierz wszystkie archiwalne aktywne notatki z całego drzewa do pamięci przeglądarki">
                <span>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<CloudSyncOutlinedIcon sx={{ fontSize: "14px !important" }} />}
                    disabled={offlineState.isSyncing}
                    onClick={handleSyncFullTree}
                    sx={{ p: 0, minWidth: 0, fontSize: "0.74rem", fontWeight: 600 }}
                  >
                    {offlineState.isSyncing ? "Synchronizacja..." : "Załaduj całe drzewo"}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
        </div>
      </div>
    );
  };

  const hasActiveFilters = Boolean(
    selectedDate || selectedFolderId != null || pinnedOnly || searchQuery.trim()
  );

  return (
    <div className="home-page">
      {renderTopBar()}

      <main className="home-container">
        {loading && enrichedPages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 10,
              gap: 2,
            }}
          >
            <CircularProgress size={36} />
            <Typography variant="body2" sx={{ color: "#6b778c" }}>
              Ładowanie mapy drzewa, kalendarza regularności i ostatnich notatek...
            </Typography>
          </Box>
        ) : error && enrichedPages.length === 0 ? (
          <Box
            sx={{
              maxWidth: 540,
              margin: "48px auto",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
              p: 3,
              textAlign: "center",
            }}
          >
            <Typography variant="subtitle1" color="error" sx={{ fontWeight: 700, mb: 1 }}>
              Błąd pobierania danych
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b778c", mb: 2.5 }}>
              {error}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}>
              <Button variant="contained" size="small" onClick={loadDashboard}>
                Spróbuj ponownie
              </Button>
              <Button component={Link} to="/Login" variant="outlined" size="small">
                Logowanie
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {/* Pasek podsumowania */}
            <section className="home-stats-grid" aria-label="Podsumowanie dziennika">
              <div className="home-stat-card">
                <span className="home-stat-label">Ostatnie 14 dni</span>
                <div className="home-stat-row">
                  <span className="home-stat-value">
                    {regularityData.count14d}{" "}
                    {regularityData.count14d === 1 ? "notatka" : "notatek"}
                  </span>
                  <span className="home-stat-sub" style={{ color: "#2e7d32", fontWeight: 600 }}>
                    {regularityData.count7d} w ost. 7 dniach
                  </span>
                </div>
              </div>

              <div className="home-stat-card">
                <span className="home-stat-label">Regularność (18 tyg.)</span>
                <div className="home-stat-row">
                  <span className="home-stat-value">
                    {regularityData.activeDaysInWindow} dni aktywne
                  </span>
                  <span className="home-stat-sub" style={{ color: "#1565c0", fontWeight: 600 }}>
                    seria: {regularityData.streak} {regularityData.streak === 1 ? "dzień" : "dni"}
                  </span>
                </div>
              </div>

              <div className="home-stat-card">
                <span className="home-stat-label">Drzewo folderów</span>
                <div className="home-stat-row">
                  <span className="home-stat-value">
                    {treemapLayout.activeFolderCount} aktywnych
                  </span>
                  <span className="home-stat-sub">{totalFolders} folderów łącznie</span>
                </div>
              </div>

              <div className="home-stat-card">
                <span className="home-stat-label">Ostatnia notatka</span>
                <div className="home-stat-row">
                  <span className="home-stat-value" style={{ fontSize: "1.02rem" }}>
                    {summaryStats.latestFormatted}
                  </span>
                  <span className="home-stat-sub">{summaryStats.latestRelative}</span>
                </div>
              </div>
            </section>

            {/* Dwa główne diagramy: Kalendarz regularności + Mapa drzewa WinDirStat */}
            <section className="home-charts-grid">
              {renderRegularityCalendar()}
              {renderWinDirStatTreemap()}
            </section>

            {/* Sekcja Ostatnie notatki */}
            <section style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="home-notes-toolbar">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "#1f2937", fontSize: "1rem" }}
                  >
                    Ostatnie notatki
                  </Typography>
                  <Chip
                    label={`${filteredNotes.length} ${
                      filteredNotes.length === 1 ? "wpis" : "wpisów"
                    }`}
                    size="small"
                    variant="outlined"
                  />

                  {selectedDate && (
                    <Chip
                      label={`Dzień: ${selectedDate}`}
                      size="small"
                      color="primary"
                      onDelete={() => setSelectedDate(null)}
                    />
                  )}

                  {selectedFolderNode && (
                    <Chip
                      label={`Folder: ${selectedFolderNode.path}`}
                      size="small"
                      color="primary"
                      onDelete={() => setSelectedFolderId(null)}
                    />
                  )}

                  {hasActiveFilters && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={clearAllFilters}
                      sx={{ fontSize: "0.78rem" }}
                    >
                      Wyczyść filtry
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <TextField
                    size="small"
                    placeholder="Szukaj w ostatnich notatkach..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setVisibleLimit(16);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchQuery("")}>
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                    sx={{ minWidth: 230, backgroundColor: "#fafafa" }}
                  />

                  <Button
                    variant={pinnedOnly ? "contained" : "outlined"}
                    color={pinnedOnly ? "secondary" : "inherit"}
                    size="small"
                    startIcon={<PushPinIcon fontSize="small" />}
                    onClick={() => {
                      setPinnedOnly((prev) => !prev);
                      setVisibleLimit(16);
                    }}
                    sx={
                      pinnedOnly
                        ? undefined
                        : { borderColor: "#d0d7de", color: "#4b5563" }
                    }
                  >
                    Przypięte ({summaryStats.pinnedCount})
                  </Button>

                  <ToggleButtonGroup
                    value={gridMode}
                    exclusive
                    onChange={handleGridModeChange}
                    size="small"
                    aria-label="układ kart notatek"
                  >
                    <Tooltip title="Siatka 2-kolumnowa">
                      <ToggleButton value="two" aria-label="2 kolumny">
                        <GridViewIcon fontSize="small" />
                      </ToggleButton>
                    </Tooltip>
                    <Tooltip title="Lista 1-kolumnowa">
                      <ToggleButton value="single" aria-label="1 kolumna">
                        <ViewAgendaOutlinedIcon fontSize="small" />
                      </ToggleButton>
                    </Tooltip>
                  </ToggleButtonGroup>
                </Box>
              </div>

              {filteredNotes.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 6,
                    px: 3,
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px dashed #d0d7de",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, color: "#374151", mb: 0.5 }}
                  >
                    {hasActiveFilters
                      ? "Brak notatek spełniających wybrane filtry"
                      : "Brak ostatnich notatek"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6b778c", mb: 2 }}>
                    {hasActiveFilters
                      ? "Zmień kryteria wyszukiwania lub kliknij poniżej, aby wyczyścić aktywny filtr z diagramu."
                      : "Otwórz drzewo notatek, aby utworzyć swój pierwszy wpis."}
                  </Typography>
                  {hasActiveFilters ? (
                    <Button variant="contained" size="small" onClick={clearAllFilters}>
                      Pokaż wszystkie notatki
                    </Button>
                  ) : (
                    <Button component={Link} to="/List" variant="contained" size="small">
                      Przejdź do drzewa notatek
                    </Button>
                  )}
                </Box>
              ) : (
                <>
                  <div
                    className={`home-notes-grid ${
                      gridMode === "single" ? "home-notes-grid--single" : ""
                    }`}
                  >
                    {filteredNotes.slice(0, visibleLimit).map((note) => {
                      const cardKey = note.pageId ?? note.frontendId;
                      const isExpanded = Boolean(expandedIds[cardKey]);
                      const mt = note.date ? moment(note.date) : null;
                      const dtFormatted =
                        mt && mt.isValid() ? mt.format("YYYY.MM.DD HH:mm") : "";
                      const dtRelative = mt && mt.isValid() ? mt.fromNow() : "";

                      return (
                        <article key={cardKey} className="home-note-card">
                          <div>
                            <div className="home-note-meta">
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.75,
                                  flexWrap: "wrap",
                                  minWidth: 0,
                                }}
                              >
                                <Tooltip title={`Otwórz folder „${note.path}” w drzewie`}>
                                  <Chip
                                    label={note.path}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    clickable
                                    onClick={() => openNoteInTree(note.journalId, null)}
                                    sx={{
                                      height: 22,
                                      fontSize: "0.74rem",
                                      maxWidth: 290,
                                    }}
                                  />
                                </Tooltip>

                                {Boolean(note.pinned) && (
                                  <Chip
                                    icon={<PushPinIcon style={{ fontSize: "0.82rem" }} />}
                                    label="Przypięta"
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                    sx={{ height: 22, fontSize: "0.73rem" }}
                                  />
                                )}

                                {Boolean(note.isOfflinePending) && (
                                  <Chip
                                    label="Pending Sync"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ height: 22, fontSize: "0.73rem", fontWeight: 600 }}
                                  />
                                )}
                              </Box>

                              {dtFormatted && (
                                <Tooltip title={dtRelative}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "#6b778c",
                                      fontSize: "0.75rem",
                                      fontVariantNumeric: "tabular-nums",
                                    }}
                                  >
                                    {dtFormatted}
                                  </Typography>
                                </Tooltip>
                              )}
                            </div>

                            <h3
                              className="home-note-title"
                              onClick={() => openNoteInTree(note.journalId, note.pageId)}
                              title="Kliknij, aby otworzyć notatkę w drzewie"
                            >
                              {note.title}
                            </h3>

                            {note.hasBody ? (
                              <p
                                className={`home-note-snippet ${
                                  isExpanded ? "" : "home-note-snippet--collapsed"
                                }`}
                              >
                                {note.preview}
                              </p>
                            ) : !note.firstImageUrl ? (
                              <p
                                className="home-note-snippet"
                                style={{ color: "#9ca3af", fontStyle: "italic" }}
                              >
                                Brak dodatkowej treści pod nagłówkiem
                              </p>
                            ) : null}

                            {note.firstImageUrl && (
                              <div style={{ marginTop: "8px" }}>
                                <img
                                  src={note.firstImageUrl}
                                  alt={note.title}
                                  loading="lazy"
                                  onClick={() => openNoteInTree(note.journalId, note.pageId)}
                                  style={{
                                    maxHeight: "140px",
                                    maxWidth: "100%",
                                    borderRadius: "6px",
                                    border: "1px solid #e5e7eb",
                                    objectFit: "cover",
                                    cursor: "pointer",
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          <div className="home-note-footer">
                            {note.hasBody && note.preview.length > 140 ? (
                              <Button
                                size="small"
                                color="inherit"
                                onClick={() => toggleExpandCard(cardKey)}
                                endIcon={
                                  isExpanded ? (
                                    <ExpandLessIcon fontSize="small" />
                                  ) : (
                                    <ExpandMoreIcon fontSize="small" />
                                  )
                                }
                                sx={{ color: "#6b778c", fontSize: "0.78rem", px: 0.75 }}
                              >
                                {isExpanded ? "Zwiń podgląd" : "Szybki podgląd"}
                              </Button>
                            ) : (
                              <span />
                            )}

                            <Button
                              size="small"
                              color="primary"
                              endIcon={<ArrowForwardIcon fontSize="small" />}
                              onClick={() => openNoteInTree(note.journalId, note.pageId)}
                              sx={{ fontWeight: 600, fontSize: "0.8rem" }}
                            >
                              Otwórz w drzewie
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {filteredNotes.length > visibleLimit && (
                    <Box sx={{ textAlign: "center", mt: 1 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => setVisibleLimit((prev) => prev + 16)}
                      >
                        Pokaż więcej ({visibleLimit} z {filteredNotes.length})
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

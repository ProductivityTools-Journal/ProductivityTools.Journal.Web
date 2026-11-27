import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import ReactDOM from "react-dom";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import { Range } from "slate";
import { focusEditor, select } from "@udecode/plate";
import { JournalTreeContext } from "Components/JournalContext/index.js";
import * as apiService from "services/apiService";
import statusService from "services/statusService";
import * as Common from "../Common.js";
import {
  subscribeGetTaskTrigger,
  subscribeGetTaskChipClick,
  generateClientTaskId,
  getGetTaskUrl,
  getSelectionCoords,
  clampPopoverCoords,
  splitSelectionTextToTitleAndDetails,
  getSelectedPlainTextWithNewlines,
  findGetTaskNodeAtSelection,
  wrapSelectionWithGetTask,
  patchGetTaskNode,
  unwrapGetTaskNode,
  unwrapGetTaskInAst,
  patchGetTaskInAst,
} from "./GetTaskPlugin";

const INBOX_RESOLUTION_ERROR_CODES = new Set([
  "NO_DEFAULT_INBOX",
  "INBOX_DELETED",
  "INBOX_CLEARED",
]);

function getInboxErrorMessage(code, fallbackMessage) {
  switch (code) {
    case "INBOX_DELETED":
      return "Domyślny inbox został usunięty w GetTask3. Wybierz inny inbox poniżej.";
    case "INBOX_CLEARED":
      return "Wybrany element nie jest już oznaczony jako inbox w GetTask3. Wybierz inny inbox poniżej.";
    case "NO_DEFAULT_INBOX":
      return "Ten Korzeń nie ma skonfigurowanego domyślnego inboxa GetTask3. Wybierz inbox poniżej.";
    default:
      return fallbackMessage || "Nie udało się wysłać zadania do GetTask3.";
  }
}

export default function GetTaskPopovers({
  editorRef,
  page,
  isReadOnly,
  ensurePageSaved,
  persistCurrentAst,
  getPageTitle,
}) {
  const journalTreeContext = useContext(JournalTreeContext);
  const popoverRef = useRef(null);
  const failedPayloadsRef = useRef(new Map());

  const [createState, setCreateState] = useState(null);
  const [viewState, setViewState] = useState(null);

  const [inboxes, setInboxes] = useState([]);
  const [inboxesLoading, setInboxesLoading] = useState(false);
  const [inboxesError, setInboxesError] = useState(null);

  const [title, setTitle] = useState("");
  const [detailsText, setDetailsText] = useState("");
  const [selectedInboxId, setSelectedInboxId] = useState("");
  const [setAsKorzenDefault, setSetAsKorzenDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [retryClientTaskId, setRetryClientTaskId] = useState(null);
  const [viewBusy, setViewBusy] = useState(false);
  const [viewError, setViewError] = useState(null);

  const isEditorMine = useCallback(
    (targetEditor) => {
      const myEditor = editorRef?.current;
      if (!targetEditor || !myEditor) return false;
      return (
        targetEditor === myEditor ||
        (targetEditor.id != null &&
          myEditor.id != null &&
          targetEditor.id === myEditor.id)
      );
    },
    [editorRef]
  );

  const loadInboxes = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setInboxesError("Tryb offline — lista inboxów GetTask3 niedostępna.");
      return [];
    }
    setInboxesLoading(true);
    setInboxesError(null);
    try {
      const list = await apiService.getGetTaskInboxes();
      const normalized = Array.isArray(list) ? list : [];
      setInboxes(normalized);
      return normalized;
    } catch (err) {
      setInboxesError(
        err?.apiMessage || err?.message || "Nie udało się pobrać listy inboxów."
      );
      return [];
    } finally {
      setInboxesLoading(false);
    }
  }, []);

  const closeAllPopovers = useCallback(
    (refocus = false) => {
      setCreateState(null);
      setViewState(null);
      setSubmitError(null);
      setViewError(null);
      setRetryClientTaskId(null);
      if (refocus && editorRef?.current && !isReadOnly) {
        try {
          focusEditor(editorRef.current);
        } catch (_err) {
          // ignore
        }
      }
    },
    [editorRef, isReadOnly]
  );

  useEffect(() => {
    const unsubTrigger = subscribeGetTaskTrigger((targetEditor) => {
      if (!isEditorMine(targetEditor)) {
        setCreateState(null);
        setViewState(null);
        return;
      }

      if (isReadOnly) {
        return;
      }

      const existingEntry = findGetTaskNodeAtSelection(targetEditor);
      if (existingEntry) {
        const [existingNode] = existingEntry;
        const coords = getSelectionCoords();
        setCreateState(null);
        setViewError(null);
        setViewState({
          element: existingNode,
          top: coords.top,
          left: coords.left,
        });
        return;
      }

      if (!targetEditor.selection || Range.isCollapsed(targetEditor.selection)) {
        statusService.warn(
          "Zaznacz fragment notatki, aby wysłać go jako zadanie do GetTask3"
        );
        return;
      }

      const rawText = getSelectedPlainTextWithNewlines(
        targetEditor,
        targetEditor.selection
      );
      const { title: initialTitle, detailsText: initialDetails } =
        splitSelectionTextToTitleAndDetails(rawText, 200);

      if (!initialTitle) {
        statusService.warn(
          "Zaznaczony fragment jest pusty — zaznacz tekst zadania"
        );
        return;
      }

      const savedSelection = JSON.parse(JSON.stringify(targetEditor.selection));
      const coords = getSelectionCoords();
      const resolvedInbox = journalTreeContext?.resolveGetTaskInbox
        ? journalTreeContext.resolveGetTaskInbox(page?.journalId)
        : null;
      const korzen = journalTreeContext?.findKorzen
        ? journalTreeContext.findKorzen(page?.journalId)
        : null;

      setViewState(null);
      setTitle(initialTitle);
      setDetailsText(initialDetails);
      setSelectedInboxId(
        resolvedInbox?.getTaskInboxElementId != null
          ? String(resolvedInbox.getTaskInboxElementId)
          : ""
      );
      setSetAsKorzenDefault(!resolvedInbox && Boolean(korzen));
      setSubmitError(null);
      setRetryClientTaskId(null);
      setCreateState({
        top: coords.top,
        left: coords.left,
        savedSelection,
        resolvedInbox,
        korzen,
      });

      loadInboxes();
    });

    const unsubChip = subscribeGetTaskChipClick((targetEditor, element, rect) => {
      if (!isEditorMine(targetEditor)) {
        setViewState(null);
        return;
      }
      const coords = clampPopoverCoords(rect, 340, 220);
      setCreateState(null);
      setViewError(null);
      setViewState({
        element,
        top: coords.top,
        left: coords.left,
      });
    });

    return () => {
      unsubTrigger();
      unsubChip();
    };
  }, [isEditorMine, isReadOnly, journalTreeContext, page?.journalId, loadInboxes]);

  // Close popovers on outside click or Escape
  useEffect(() => {
    if (!createState && !viewState) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeAllPopovers(true);
      }
    };

    const handleMouseDown = (e) => {
      // Do not dismiss when interacting with MUI Select menu portals
      if (
        e.target &&
        typeof e.target.closest === "function" &&
        (e.target.closest(".MuiPopover-root") ||
          e.target.closest(".MuiMenu-root") ||
          e.target.closest(".MuiModal-root"))
      ) {
        return;
      }
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        closeAllPopovers(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("mousedown", handleMouseDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("mousedown", handleMouseDown, true);
    };
  }, [createState, viewState, closeAllPopovers]);

  const handleCreateSubmit = async () => {
    if (!createState || submitting) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSubmitError({
        code: "OFFLINE",
        message: "Jesteś offline — wysyłanie zadań wymaga połączenia z internetem.",
      });
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setSubmitError({
        code: "VALIDATION",
        message: "Podaj tytuł zadania.",
      });
      return;
    }

    const editor = editorRef?.current;
    if (!editor) return;

    const { savedSelection, resolvedInbox, korzen } = createState;
    const hasValidResolvedInbox =
      resolvedInbox != null && !submitError?.isInboxError;
    const chosenInbox = inboxes.find(
      (item) => String(item.elementId) === String(selectedInboxId)
    );

    const effectiveInboxId = selectedInboxId
      ? Number(selectedInboxId)
      : hasValidResolvedInbox
      ? resolvedInbox.getTaskInboxElementId
      : null;
    const effectiveInboxName =
      chosenInbox?.inboxName ||
      chosenInbox?.name ||
      (hasValidResolvedInbox &&
      String(resolvedInbox.getTaskInboxElementId) === String(effectiveInboxId)
        ? resolvedInbox.getTaskInboxName
        : "") ||
      "";

    const isUsingKorzenDefault =
      hasValidResolvedInbox &&
      effectiveInboxId != null &&
      Number(resolvedInbox.getTaskInboxElementId) === Number(effectiveInboxId);

    const overrideInboxElementId = isUsingKorzenDefault
      ? null
      : effectiveInboxId != null
      ? Number(effectiveInboxId)
      : null;

    setSubmitting(true);
    setSubmitError(null);

    let activeClientTaskId = retryClientTaskId;
    let wrappedNow = false;

    try {
      // Step 1: Ensure note has a real pageId before sending (auto-save new notes first)
      let currentPage = page;
      if (currentPage?.pageId == null) {
        currentPage = await ensurePageSaved();
      }
      if (!currentPage || currentPage.pageId == null) {
        throw new Error("Nie udało się zapisać notatki przed wysłaniem zadania.");
      }

      // Step 2: Generate clientTaskId & wrap selection (or mark existing retry node pending)
      if (!activeClientTaskId) {
        activeClientTaskId = generateClientTaskId();
        const wrapped = wrapSelectionWithGetTask(editor, savedSelection, {
          clientTaskId: activeClientTaskId,
          getTaskId: null,
          getTaskUrl: null,
          inboxElementId: effectiveInboxId,
          inboxName: effectiveInboxName,
          syncStatus: "pending",
        });
        if (!wrapped) {
          throw new Error("Nie udało się oznaczyć zaznaczonego fragmentu notatki.");
        }
        wrappedNow = true;
      } else {
        patchGetTaskNode(editor, activeClientTaskId, {
          inboxElementId: effectiveInboxId,
          inboxName: effectiveInboxName,
          syncStatus: "pending",
        });
      }

      const trimmedDetails = detailsText.trim();
      const pageTitle = typeof getPageTitle === "function" ? getPageTitle() : page?.subject || "";

      const requestPayload = {
        clientTaskId: activeClientTaskId,
        pageId: Number(currentPage.pageId),
        journalId: Number(currentPage.journalId),
        title: trimmedTitle,
        detailsText: trimmedDetails || null,
        pageTitle: pageTitle || null,
        overrideInboxElementId,
      };

      // Step 3: Create task in GetTask3 via Journal.Api
      const result = await apiService.createGetTaskFromNote(requestPayload);

      // Step 4: Patch AST node with synced metadata & auto-save updated note immediately
      const syncedInboxId = result?.inboxElementId ?? effectiveInboxId;
      const syncedInboxName = result?.inboxName || effectiveInboxName;

      patchGetTaskNode(editor, activeClientTaskId, {
        getTaskId: result?.getTaskElementId ?? null,
        getTaskUrl: result?.getTaskUrl ?? null,
        inboxElementId: syncedInboxId,
        inboxName: syncedInboxName,
        syncStatus: "synced",
      });

      failedPayloadsRef.current.delete(activeClientTaskId);

      // Persist updated AST immediately so GetTask3 task & note AST stay in sync
      await persistCurrentAst(editor.children, currentPage);

      // Optionally persist chosen inbox as Korzeń default
      if (setAsKorzenDefault && korzen && syncedInboxId != null) {
        try {
          await apiService.setGetTaskInbox(
            korzen.id,
            Number(syncedInboxId),
            syncedInboxName
          );
          if (journalTreeContext?.updateNodeGetTaskInbox) {
            journalTreeContext.updateNodeGetTaskInbox(
              korzen.id,
              Number(syncedInboxId),
              syncedInboxName
            );
          }
        } catch (defaultErr) {
          console.warn("Task created, but failed to update Korzeń default inbox:", defaultErr);
        }
      }

      closeAllPopovers(true);
    } catch (err) {
      const code = err?.code || null;
      const status = err?.status ?? err?.response?.status ?? null;
      const isInboxError =
        INBOX_RESOLUTION_ERROR_CODES.has(code) ||
        status === 404 ||
        status === 409;

      if (isInboxError && (code === "INBOX_DELETED" || code === "INBOX_CLEARED" || code === "NO_DEFAULT_INBOX")) {
        // Step 5: Unwrap pending node so selection remains intact & let user pick another inbox
        if (activeClientTaskId && (wrappedNow || retryClientTaskId)) {
          unwrapGetTaskNode(editor, activeClientTaskId);
          try {
            if (savedSelection) {
              select(editor, savedSelection);
            }
          } catch (_selErr) {
            // ignore stale selection restore
          }
        }
        setRetryClientTaskId(null);
        setSelectedInboxId("");
        if (korzen) {
          setSetAsKorzenDefault(true);
        }
        setSubmitError({
          code,
          isInboxError: true,
          message: getInboxErrorMessage(code, err?.apiMessage),
        });
        loadInboxes();
      } else {
        // Step 6: Transient error -> keep node with syncStatus: "failed" & enable 1-click retry with same clientTaskId
        if (activeClientTaskId) {
          patchGetTaskNode(editor, activeClientTaskId, { syncStatus: "failed" });
          failedPayloadsRef.current.set(activeClientTaskId, {
            title: trimmedTitle,
            detailsText: detailsText.trim() || null,
            overrideInboxElementId,
            inboxElementId: effectiveInboxId,
            inboxName: effectiveInboxName,
          });
          setRetryClientTaskId(activeClientTaskId);
        }
        setSubmitError({
          code: code || "TRANSIENT",
          isTransient: true,
          message:
            err?.apiMessage ||
            err?.message ||
            "Nie udało się wysłać zadania. Możesz ponowić próbę bez ryzyka duplikatu.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewRetry = async () => {
    if (!viewState?.element || viewBusy) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setViewError("Jesteś offline — ponowienie wysyłki wymaga połączenia z internetem.");
      return;
    }

    const element = viewState.element;
    const clientTaskId = element.clientTaskId;
    if (!clientTaskId) return;

    setViewBusy(true);
    setViewError(null);

    try {
      let currentPage = page;
      if (currentPage?.pageId == null) {
        currentPage = await ensurePageSaved();
      }

      const cached = failedPayloadsRef.current.get(clientTaskId);
      const fallbackText = Common.getPlainTextFromSlateStructure(element.children || []);
      const splitFallback = splitSelectionTextToTitleAndDetails(fallbackText, 200);
      const pageTitle = typeof getPageTitle === "function" ? getPageTitle() : page?.subject || "";

      const payload = {
        clientTaskId,
        pageId: Number(currentPage.pageId),
        journalId: Number(currentPage.journalId),
        title: cached?.title || splitFallback.title || "Zadanie z notatki",
        detailsText: cached?.detailsText ?? (splitFallback.detailsText || null),
        pageTitle: pageTitle || null,
        overrideInboxElementId:
          cached?.overrideInboxElementId ??
          (element.inboxElementId != null ? Number(element.inboxElementId) : null),
      };

      const editor = editorRef?.current;
      if (editor && !isReadOnly) {
        patchGetTaskNode(editor, clientTaskId, { syncStatus: "pending" });
      }

      const result = await apiService.createGetTaskFromNote(payload);
      const syncedPatch = {
        getTaskId: result?.getTaskElementId ?? null,
        getTaskUrl: result?.getTaskUrl ?? null,
        inboxElementId: result?.inboxElementId ?? element.inboxElementId ?? null,
        inboxName: result?.inboxName || element.inboxName || "",
        syncStatus: "synced",
      };

      let updatedAst;
      if (editor && !isReadOnly) {
        patchGetTaskNode(editor, clientTaskId, syncedPatch);
        updatedAst = editor.children;
      } else {
        updatedAst = patchGetTaskInAst(page?.contentObject, clientTaskId, syncedPatch);
      }

      failedPayloadsRef.current.delete(clientTaskId);
      await persistCurrentAst(updatedAst, currentPage);

      setViewState((prev) =>
        prev
          ? {
              ...prev,
              element: { ...prev.element, ...syncedPatch },
            }
          : null
      );
    } catch (err) {
      const editor = editorRef?.current;
      if (editor && !isReadOnly) {
        patchGetTaskNode(editor, clientTaskId, { syncStatus: "failed" });
      }
      setViewError(
        err?.apiMessage ||
          err?.message ||
          "Ponowna próba nie powiodła się. Spróbuj ponownie."
      );
    } finally {
      setViewBusy(false);
    }
  };

  const handleUnlink = async () => {
    if (!viewState?.element || viewBusy) return;
    const clientTaskId = viewState.element.clientTaskId;
    if (!clientTaskId) return;

    setViewBusy(true);
    setViewError(null);
    try {
      const editor = editorRef?.current;
      let updatedAst;
      if (editor && !isReadOnly) {
        unwrapGetTaskNode(editor, clientTaskId);
        updatedAst = editor.children;
      } else {
        updatedAst = unwrapGetTaskInAst(page?.contentObject, clientTaskId);
      }

      failedPayloadsRef.current.delete(clientTaskId);
      if (page?.pageId != null) {
        await persistCurrentAst(updatedAst);
      }
      statusService.info("Zadanie odpięte z notatki (zadanie w GetTask3 pozostało nietknięte)");
      closeAllPopovers(true);
    } catch (err) {
      setViewError(
        err?.apiMessage || err?.message || "Nie udało się odpiąć zadania z notatki."
      );
    } finally {
      setViewBusy(false);
    }
  };

  if (typeof document === "undefined" || (!createState && !viewState)) {
    return null;
  }

  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  if (createState) {
    const { resolvedInbox, korzen } = createState;
    const selectedDiffersFromDefault =
      Boolean(selectedInboxId) &&
      (!resolvedInbox ||
        String(resolvedInbox.getTaskInboxElementId) !== String(selectedInboxId));

    const showSetDefaultCheckbox =
      Boolean(korzen) && (selectedDiffersFromDefault || !resolvedInbox || submitError?.isInboxError);

    // Ensure resolved default inbox is always selectable in Select even before live list resolves
    const selectOptions = [...inboxes];
    if (
      resolvedInbox?.getTaskInboxElementId != null &&
      !submitError?.isInboxError &&
      !selectOptions.some(
        (item) => Number(item.elementId) === Number(resolvedInbox.getTaskInboxElementId)
      )
    ) {
      selectOptions.unshift({
        elementId: resolvedInbox.getTaskInboxElementId,
        inboxName:
          resolvedInbox.getTaskInboxName || `#${resolvedInbox.getTaskInboxElementId}`,
        path: `Domyślny dla Korzenia „${resolvedInbox.sourceJournalName}”`,
      });
    }

    return ReactDOM.createPortal(
      <div
        ref={popoverRef}
        role="dialog"
        aria-label="Wyślij zadanie do GetTask3"
        style={{
          position: "fixed",
          top: createState.top,
          left: createState.left,
          width: "360px",
          maxWidth: "calc(100vw - 24px)",
          zIndex: 1300,
          backgroundColor: "#ffffff",
          color: "#2c3e50",
          border: "1px solid #d0d7de",
          borderRadius: "10px",
          padding: "14px 16px",
          boxShadow: "0 8px 28px rgba(0, 0, 0, 0.16)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1565c0" }}>
            Wyślij fragment jako zadanie (GetTask3)
          </Typography>
          <IconButton
            size="small"
            onClick={() => closeAllPopovers(true)}
            disabled={submitting}
            aria-label="Zamknij"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {isOffline && (
          <Alert severity="warning" sx={{ mb: 1.5, py: 0.25, fontSize: "0.78rem" }}>
            Tryb offline — wysyłanie zadań do GetTask3 jest niedostępne bez internetu.
          </Alert>
        )}

        {submitError && (
          <Alert severity="error" sx={{ mb: 1.5, py: 0.25, fontSize: "0.78rem" }}>
            {submitError.message}
          </Alert>
        )}

        {inboxesError && !submitError && (
          <Alert severity="warning" sx={{ mb: 1.5, py: 0.25, fontSize: "0.78rem" }}>
            {inboxesError}
          </Alert>
        )}

        <TextField
          label="Tytuł zadania"
          size="small"
          fullWidth
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleCreateSubmit();
            }
          }}
          disabled={submitting}
          sx={{ mb: 1.25 }}
          inputProps={{ maxLength: 250 }}
        />

        <TextField
          label="Szczegóły (opcjonalne)"
          size="small"
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          value={detailsText}
          onChange={(e) => setDetailsText(e.target.value)}
          disabled={submitting}
          sx={{ mb: 1.5 }}
        />

        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
          <InputLabel id="create-task-inbox-label">Inbox GetTask3</InputLabel>
          <Select
            labelId="create-task-inbox-label"
            id="create-task-inbox-select"
            value={selectedInboxId}
            label="Inbox GetTask3"
            onChange={(e) => setSelectedInboxId(e.target.value)}
            disabled={submitting || isOffline}
          >
            {inboxesLoading && selectOptions.length === 0 ? (
              <MenuItem value="" disabled>
                Ładowanie inboxów...
              </MenuItem>
            ) : selectOptions.length === 0 ? (
              <MenuItem value="" disabled>
                Brak dostępnych inboxów
              </MenuItem>
            ) : (
              selectOptions.map((inbox) => (
                <MenuItem key={inbox.elementId} value={String(inbox.elementId)}>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {inbox.inboxName || inbox.name}
                    </Typography>
                    {inbox.path && (
                      <Typography variant="caption" color="text.secondary">
                        {inbox.path}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {resolvedInbox && !submitError?.isInboxError && (
          <Typography
            variant="caption"
            sx={{ display: "block", color: "#546e7a", mb: 0.75 }}
          >
            Domyślny inbox Korzenia „{resolvedInbox.sourceJournalName}”:{" "}
            <strong>{resolvedInbox.getTaskInboxName || `#${resolvedInbox.getTaskInboxElementId}`}</strong>
          </Typography>
        )}

        {showSetDefaultCheckbox && korzen && (
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={setAsKorzenDefault}
                onChange={(e) => setSetAsKorzenDefault(e.target.checked)}
                disabled={submitting}
              />
            }
            label={
              <Typography variant="caption" sx={{ color: "#333" }}>
                Ustaw jako domyślny dla Korzenia „{korzen.name}”
              </Typography>
            }
            sx={{ mb: 1, display: "flex" }}
          />
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => closeAllPopovers(true)}
            disabled={submitting}
          >
            Anuluj
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={
              submitting ? (
                <CircularProgress size={14} color="inherit" />
              ) : retryClientTaskId ? (
                <RefreshIcon fontSize="small" />
              ) : (
                <SendIcon fontSize="small" />
              )
            }
            onClick={handleCreateSubmit}
            disabled={
              submitting ||
              isOffline ||
              !title.trim() ||
              (!selectedInboxId && (!resolvedInbox || Boolean(submitError?.isInboxError)))
            }
          >
            {submitting
              ? "Wysyłanie..."
              : retryClientTaskId
              ? "Ponów wysyłkę"
              : "Wyślij do GetTask3"}
          </Button>
        </Box>
      </div>,
      document.body
    );
  }

  // Task View Popover
  const { element } = viewState;
  const syncStatus =
    element?.syncStatus || (element?.getTaskId != null ? "synced" : "pending");
  const taskUrl = getGetTaskUrl(element);
  const inboxDisplay =
    element?.inboxName ||
    (element?.inboxElementId != null ? `#${element.inboxElementId}` : "—");

  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Szczegóły zadania GetTask3"
      style={{
        position: "fixed",
        top: viewState.top,
        left: viewState.left,
        width: "320px",
        maxWidth: "calc(100vw - 24px)",
        zIndex: 1300,
        backgroundColor: "#ffffff",
        color: "#2c3e50",
        border: "1px solid #d0d7de",
        borderRadius: "10px",
        padding: "12px 14px",
        boxShadow: "0 8px 28px rgba(0, 0, 0, 0.16)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#2c3e50" }}>
            Zadanie GetTask3
          </Typography>
          <Chip
            size="small"
            label={
              syncStatus === "synced"
                ? "Zsynchronizowane"
                : syncStatus === "failed"
                ? "Błąd"
                : "Wysyłanie..."
            }
            color={
              syncStatus === "synced"
                ? "success"
                : syncStatus === "failed"
                ? "error"
                : "info"
            }
            variant="outlined"
            sx={{ height: 20, fontSize: "0.7rem" }}
          />
        </Box>
        <IconButton
          size="small"
          onClick={() => closeAllPopovers(true)}
          disabled={viewBusy}
          aria-label="Zamknij"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Typography variant="body2" sx={{ color: "#546e7a", mb: 1.25 }}>
        Inbox: <strong>{inboxDisplay}</strong>
      </Typography>

      {viewError && (
        <Alert severity="error" sx={{ mb: 1.25, py: 0.25, fontSize: "0.78rem" }}>
          {viewError}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        {taskUrl && (
          <Button
            component="a"
            href={taskUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            variant="contained"
            color="primary"
            startIcon={<OpenInNewIcon fontSize="small" />}
          >
            Otwórz w GetTask3
          </Button>
        )}

        {syncStatus === "failed" && (
          <Button
            size="small"
            variant="contained"
            color="warning"
            startIcon={
              viewBusy ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <RefreshIcon fontSize="small" />
              )
            }
            onClick={handleViewRetry}
            disabled={viewBusy || isOffline}
          >
            Ponów
          </Button>
        )}

        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<LinkOffIcon fontSize="small" />}
          onClick={handleUnlink}
          disabled={viewBusy}
        >
          Odepnij z notatki
        </Button>
      </Box>
    </div>,
    document.body
  );
}

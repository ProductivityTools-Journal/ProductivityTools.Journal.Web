import React, { useEffect, useState, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import * as apiService from "services/apiService";

export default function GetTaskInboxModal({
  open,
  selectedJournal,
  closeAndRefresh,
  closeModal,
}) {
  const [inboxes, setInboxes] = useState([]);
  const [selectedInboxId, setSelectedInboxId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const existingInboxId =
    selectedJournal?.getTaskInboxElementId ??
    selectedJournal?.GetTaskInboxElementId ??
    null;
  const existingInboxName =
    selectedJournal?.getTaskInboxName ??
    selectedJournal?.GetTaskInboxName ??
    "";

  const loadInboxes = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("Jesteś offline — konfiguracja domyślnego inboxa GetTask3 wymaga połączenia z internetem.");
      setInboxes([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await apiService.getGetTaskInboxes();
      const normalized = Array.isArray(list) ? list : [];
      setInboxes(normalized);

      if (existingInboxId != null) {
        const existsInList = normalized.some(
          (item) => Number(item.elementId) === Number(existingInboxId)
        );
        setSelectedInboxId(existsInList ? String(existingInboxId) : "");
      } else {
        setSelectedInboxId("");
      }
    } catch (err) {
      console.error("Failed to load GetTask3 inboxes:", err);
      setError(
        err?.apiMessage ||
          err?.message ||
          "Nie udało się pobrać listy inboxów z GetTask3."
      );
      setInboxes([]);
    } finally {
      setLoading(false);
    }
  }, [existingInboxId]);

  useEffect(() => {
    if (open) {
      loadInboxes();
    } else {
      setError(null);
      setSaving(false);
    }
  }, [open, loadInboxes]);

  const savedInboxMissing =
    !loading &&
    !error &&
    existingInboxId != null &&
    !inboxes.some((item) => Number(item.elementId) === Number(existingInboxId));

  const handleSave = async () => {
    if (!selectedJournal || !selectedInboxId) return;
    const chosen = inboxes.find(
      (item) => String(item.elementId) === String(selectedInboxId)
    );
    if (!chosen) return;

    setSaving(true);
    setError(null);
    try {
      await apiService.setGetTaskInbox(
        Number(selectedJournal.id),
        Number(chosen.elementId),
        chosen.inboxName || chosen.name || ""
      );
      closeAndRefresh();
    } catch (err) {
      console.error("Failed to set GetTask3 inbox:", err);
      setError(
        err?.apiMessage ||
          err?.message ||
          "Nie udało się zapisać domyślnego inboxa GetTask3."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!selectedJournal) return;
    setSaving(true);
    setError(null);
    try {
      await apiService.removeGetTaskInbox(Number(selectedJournal.id));
      closeAndRefresh();
    } catch (err) {
      console.error("Failed to clear GetTask3 inbox:", err);
      setError(
        err?.apiMessage ||
          err?.message ||
          "Nie udało się usunąć domyślnego inboxa GetTask3."
      );
    } finally {
      setSaving(false);
    }
  };

  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  return (
    <Dialog open={open} onClose={saving ? undefined : closeModal} maxWidth="xs" fullWidth>
      <DialogTitle>Domyślny inbox GetTask3</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2, color: "#444" }}>
          Korzeń: <strong>{selectedJournal?.name}</strong>
        </Typography>

        {savedInboxMissing && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Zapisany wcześniej inbox{" "}
            <strong>{existingInboxName || `#${existingInboxId}`}</strong> nie istnieje
            już na liście inboxów w GetTask3. Wybierz nowy inbox lub wyczyść ustawienie.
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              !isOffline ? (
                <Button color="inherit" size="small" onClick={loadInboxes}>
                  Ponów
                </Button>
              ) : null
            }
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Ładowanie inboxów z GetTask3...
            </Typography>
          </Box>
        ) : !error && inboxes.length === 0 ? (
          <Alert severity="info">
            Nie znaleziono żadnych inboxów w GetTask3. Ustaw nazwę inboxa na węźle w
            GetTask3, a następnie odśwież.
          </Alert>
        ) : !error ? (
          <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
            <InputLabel id="gettask-inbox-select-label">Inbox GetTask3</InputLabel>
            <Select
              labelId="gettask-inbox-select-label"
              id="gettask-inbox-select"
              value={selectedInboxId}
              label="Inbox GetTask3"
              onChange={(e) => setSelectedInboxId(e.target.value)}
              disabled={saving}
            >
              {inboxes.map((inbox) => (
                <MenuItem key={inbox.elementId} value={String(inbox.elementId)}>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {inbox.inboxName || inbox.name}
                    </Typography>
                    {(inbox.path || (inbox.name && inbox.name !== inbox.inboxName)) && (
                      <Typography variant="caption" color="text.secondary">
                        {inbox.path || inbox.name}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        {existingInboxId != null && (
          <Button
            color="error"
            variant="outlined"
            size="small"
            onClick={handleClear}
            disabled={saving || isOffline}
            sx={{ mr: "auto" }}
          >
            Wyczyść
          </Button>
        )}
        <Button onClick={closeModal} disabled={saving} size="small">
          Anuluj
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={handleSave}
          disabled={saving || loading || !selectedInboxId || isOffline}
        >
          {saving ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

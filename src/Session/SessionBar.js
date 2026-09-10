import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Popover from "@mui/material/Popover";
import CircularProgress from "@mui/material/CircularProgress";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import * as moment from "moment";
import { useAuth } from "./AuthContext";
import statusService from "../services/statusService";

export default function SessionBar() {
  const { user, tokenRefreshTime, refreshToken } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusState, setStatusState] = useState(() => statusService.getState());
  const [popoverAnchor, setPopoverAnchor] = useState(null);

  useEffect(() => {
    const unsubscribe = statusService.subscribe((state) => {
      setStatusState(state);
    });
    return unsubscribe;
  }, []);

  if (!user) {
    return null;
  }

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      statusService.info("Forced token refresh requested");
      await refreshToken();
      statusService.success("Token refreshed successfully");
    } catch (err) {
      console.error("Failed to refresh token", err);
      statusService.error("Token refresh failed");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formattedTime = tokenRefreshTime
    ? moment(tokenRefreshTime).format("YYYY.MM.DD HH:mm:ss")
    : "pending...";

  const current = statusState.current;
  const history = statusState.history;

  const renderStatusIcon = (type) => {
    switch (type) {
      case "pending":
        return <CircularProgress size={10} thickness={5} sx={{ color: "#1976d2", flexShrink: 0 }} />;
      case "success":
        return <CheckCircleOutlineIcon sx={{ fontSize: 13, color: "#777", flexShrink: 0 }} />;
      case "error":
        return <ErrorOutlineIcon sx={{ fontSize: 13, color: "#d32f2f", flexShrink: 0 }} />;
      case "warn":
        return <WarningAmberIcon sx={{ fontSize: 13, color: "#ed6c02", flexShrink: 0 }} />;
      case "info":
        return <InfoOutlinedIcon sx={{ fontSize: 13, color: "#777", flexShrink: 0 }} />;
      default:
        return (
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#9e9e9e",
              flexShrink: 0,
            }}
          />
        );
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case "pending":
        return "#1565c0";
      case "success":
        return "#777";
      case "error":
        return "#c62828";
      case "warn":
        return "#e65100";
      case "info":
        return "#777";
      default:
        return "#777";
    }
  };

  const renderStatusText = () => {
    if (!current) {
      return "Ready";
    }
    const timeStr = moment(current.timestamp).format("HH:mm:ss");
    const durStr = current.durationMs != null ? ` (${current.durationMs}ms)` : "";
    return `[${timeStr}] ${current.message}${durStr}`;
  };

  return (
    <Box
      sx={{
        backgroundColor: "#f5f6f8",
        borderBottom: "1px solid #e0e0e0",
        px: 2,
        py: "2px",
        minHeight: "22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "11px",
        color: "#616161",
        boxSizing: "border-box",
      }}
    >
      {/* Left: User Session */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "#4caf50",
            flexShrink: 0,
          }}
        />
        <Typography sx={{ fontSize: "11px", color: "#666" }}>
          Session: <strong style={{ color: "#444" }}>{user.email}</strong>
        </Typography>
      </Box>

      {/* Right: Info / Status + Vertical Line + Token Refresh */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
        {/* Info Message (without border) */}
        <Tooltip title="Click to view debug history" arrow>
          <Box
            onClick={(e) => setPopoverAnchor(e.currentTarget)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.6,
              px: 0.5,
              py: "1px",
              borderRadius: "3px",
              cursor: "pointer",
              maxWidth: "400px",
              transition: "background-color 0.15s ease",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.05)",
              },
            }}
          >
            {renderStatusIcon(current?.type)}
            <Typography
              sx={{
                fontSize: "11px",
                color: getStatusColor(current?.type),
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {renderStatusText()}
            </Typography>
          </Box>
        </Tooltip>

        {/* Vertical line between info message and token refresh info */}
        <Box
          sx={{
            width: "1px",
            height: "12px",
            backgroundColor: "#d0d0d0",
            mx: 0.5,
            flexShrink: 0,
          }}
        />

        {/* Token Refresh */}
        <Typography sx={{ fontSize: "11px", color: "#777" }}>
          Token refreshed: <span style={{ color: "#444" }}>{formattedTime}</span>
        </Typography>
        <Tooltip title="Force token refresh">
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={isRefreshing}
            sx={{
              p: "2px",
              color: "#777",
              "&:hover": { color: "#1976d2" },
            }}
          >
            <RefreshIcon
              sx={{
                fontSize: 13,
                animation: isRefreshing ? "spin 1s linear infinite" : "none",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Debug History Popover */}
      <Popover
        open={Boolean(popoverAnchor)}
        anchorEl={popoverAnchor}
        onClose={() => setPopoverAnchor(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: "520px",
              maxHeight: "380px",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              p: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            },
          },
        }}
      >
        {/* Popover Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1,
            backgroundColor: "#f5f6f8",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#333" }}>
              Debug Activity Log
            </Typography>
            <Typography sx={{ fontSize: "11px", color: "#888" }}>
              ({history.length} {history.length === 1 ? "entry" : "entries"})
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {history.length > 0 && (
              <IconButton
                size="small"
                onClick={() => statusService.clearHistory()}
                sx={{ p: 0.5, color: "#666" }}
                title="Clear log"
              >
                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={() => setPopoverAnchor(null)}
              sx={{ p: 0.5, color: "#666" }}
              title="Close"
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Popover History Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 1,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            backgroundColor: "#fafafa",
          }}
        >
          {history.length === 0 ? (
            <Typography sx={{ fontSize: "12px", color: "#999", p: 2, textAlign: "center" }}>
              No activity recorded yet
            </Typography>
          ) : (
            history.map((entry) => (
              <Box
                key={entry.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 0.75,
                  px: 1,
                  backgroundColor: "#fff",
                  borderRadius: "4px",
                  border: "1px solid #eeeeee",
                  fontSize: "11px",
                  gap: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
                  {renderStatusIcon(entry.type)}
                  <Typography
                    sx={{
                      fontSize: "11px",
                      color: "#888",
                      flexShrink: 0,
                    }}
                  >
                    {moment(entry.timestamp).format("HH:mm:ss")}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "11px",
                      color: entry.type === "error" ? "#d32f2f" : "#000000",
                      wordBreak: "break-word",
                    }}
                  >
                    {entry.message}
                  </Typography>
                </Box>
                {entry.durationMs != null && (
                  <Typography
                    sx={{
                      fontSize: "10px",
                      color: "#888",
                      flexShrink: 0,
                      backgroundColor: "#f0f0f0",
                      px: 0.5,
                      py: "1px",
                      borderRadius: "3px",
                    }}
                  >
                    {entry.durationMs}ms
                  </Typography>
                )}
              </Box>
            ))
          )}
        </Box>
      </Popover>
    </Box>
  );
}

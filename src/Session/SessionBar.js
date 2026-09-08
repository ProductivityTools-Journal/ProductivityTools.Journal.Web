import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import RefreshIcon from "@mui/icons-material/Refresh";
import * as moment from "moment";
import { useAuth } from "./AuthContext";

export default function SessionBar() {
  const { user, tokenRefreshTime, refreshToken } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!user) {
    return null;
  }

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshToken();
    } catch (err) {
      console.error("Failed to refresh token", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formattedTime = tokenRefreshTime
    ? moment(tokenRefreshTime).format("YYYY.MM.DD HH:mm:ss")
    : "pending...";

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
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
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
    </Box>
  );
}

import { createContext, useEffect, useContext, useState, useCallback } from "react";
import { isJwtExpired } from "jwt-check-expiration";
import { auth } from "./firebase";
import statusService from "../services/statusService";

const AuthContext = createContext({
  user: null,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tokenRefreshTime, setTokenRefreshTime] = useState(() => {
    const stored = localStorage.getItem("tokenRefreshTime");
    return stored ? new Date(stored) : null;
  });

  const refreshToken = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken(true);
      const now = new Date();
      localStorage.setItem("token", token);
      localStorage.setItem("tokenRefreshTime", now.toISOString());
      setTokenRefreshTime(now);
      return token;
    }
    return null;
  }, []);

  useEffect(() => {
    // Adds an observer for changes to the signed-in user's ID token (sign-in, sign-out, token refresh)
    const unsubscribe = auth.onIdTokenChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setTokenRefreshTime(null);
        localStorage.removeItem("token");
        localStorage.removeItem("tokenRefreshTime");
      } else {
        setUser(firebaseUser);
        const token = await firebaseUser.getIdToken();
        let expired = false;
        try {
          expired = isJwtExpired(token);
        } catch (e) {
          expired = true;
        }

        if (expired) {
          await refreshToken();
        } else {
          localStorage.setItem("token", token);
          localStorage.setItem("refreshToken", firebaseUser.refreshToken);
          const tokenResult = await firebaseUser.getIdTokenResult();
          const issuedAt = tokenResult?.claims?.iat
            ? new Date(tokenResult.claims.iat * 1000)
            : new Date();
          localStorage.setItem("tokenRefreshTime", issuedAt.toISOString());
          setTokenRefreshTime(issuedAt);
        }
      }
    });

    return () => unsubscribe();
  }, [refreshToken]);

  useEffect(() => {
    const checkAndRefreshIfNeeded = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = localStorage.getItem("token");
      let shouldRefresh = !token;

      if (token) {
        try {
          if (isJwtExpired(token)) {
            shouldRefresh = true;
          } else {
            const tokenResult = await currentUser.getIdTokenResult();
            const expMs = tokenResult?.claims?.exp ? tokenResult.claims.exp * 1000 : 0;
            // Refresh if less than 15 minutes remaining
            if (expMs && expMs - Date.now() < 15 * 60 * 1000) {
              shouldRefresh = true;
            }
          }
        } catch (e) {
          shouldRefresh = true;
        }
      }

      if (shouldRefresh) {
        try {
          statusService.info("Auto-refreshing session token...");
          await refreshToken();
          statusService.success("Session token refreshed");
        } catch (err) {
          console.error("Auto token refresh error:", err);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndRefreshIfNeeded();
      }
    };

    const handleWindowFocus = () => {
      checkAndRefreshIfNeeded();
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Silent background check every 5 minutes
    const intervalId = setInterval(checkAndRefreshIfNeeded, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [refreshToken]);

  return (
    <AuthContext.Provider value={{ user, tokenRefreshTime, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
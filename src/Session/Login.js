import React, { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { auth, signInWithGoogle } from "./firebase.js";
import { useAuthState } from "react-firebase-hooks/auth";
import "./Login.css";

export function getSafeReturnUrl(returnUrl) {
  if (typeof returnUrl !== "string") return "/home";
  const trimmed = returnUrl.trim();
  if (
    !trimmed ||
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.toLowerCase().startsWith("/login")
  ) {
    return "/home";
  }
  return trimmed;
}

export default function Login() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (user) {
      const requested =
        searchParams.get("returnUrl") ||
        (location.state && location.state.from) ||
        "";
      navigate(getSafeReturnUrl(requested), { replace: true });
    }
  }, [user, loading, navigate, searchParams, location.state]);

  return (
    <div className="login">
      <div className="login__container">
        <button className="login__btn login__google" onClick={signInWithGoogle}>
          Login with Google
        </button>
      </div>
    </div>
  );
}

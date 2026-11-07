import React from "react";
import ReactDOM from 'react-dom/client';
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
 // <React.StrictMode>//if not commented then plate refreshes indefinetely 
    <App />
  //</React.StrictMode>
);

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/offline-sw.js")
      .catch((err) => console.warn("Offline service worker registration failed:", err));
  });
}

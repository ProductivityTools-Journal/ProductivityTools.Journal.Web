import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";

ReactDOM.render(
  // <React.StrictMode>
  // if I turn on this then plate not working it refreshes all the time
    <App />,
  // </React.StrictMode>,
  document.getElementById("root")
);

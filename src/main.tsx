import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

const ORDER_RESET_VERSION = "iax-orders-reset-v1";
if (localStorage.getItem(ORDER_RESET_VERSION) !== "1") {
  localStorage.removeItem("iax-member-orders");
  localStorage.setItem(ORDER_RESET_VERSION, "1");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

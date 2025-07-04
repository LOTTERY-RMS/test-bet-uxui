import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { App as AntApp } from "antd";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AntApp>
      <App />
    </AntApp>
  </StrictMode>
);

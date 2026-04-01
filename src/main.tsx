import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Apply dark mode from localStorage before first paint
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

// Start MSW in development mode
async function prepare() {
  if (import.meta.env.VITE_APP_ENV !== "production") {
    const { worker } = await import("./mocks/browser");
    return worker.start({ onUnhandledRequest: "bypass" });
  }
}

prepare().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

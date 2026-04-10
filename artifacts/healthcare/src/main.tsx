import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Set auth token getter at module level so it's ready before any React Query fires
setAuthTokenGetter(() => localStorage.getItem("accessToken"));

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <App />
  </ThemeProvider>
);

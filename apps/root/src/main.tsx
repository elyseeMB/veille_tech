import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import { ThemeProvider } from "./components/Theme-provider.tsx";
import { BannerProvider } from "./components/BannerContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <BannerProvider>
          <App />
        </BannerProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
);

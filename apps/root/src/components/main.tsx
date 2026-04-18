import "./index.css";
import { App } from "./App.tsx";
import { TooltipProvider } from "./ui/tooltip.tsx";
import { ThemeProvider } from "./Theme-provider.tsx";

export function Main() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </ThemeProvider>
  );
}

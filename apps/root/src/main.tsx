import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { ThemeProvider } from "./components/Theme-provider.tsx";
import { Dialog } from "./components/ui/dialog.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import { queryClient } from "./queryClient";
import { router } from "./router";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
				<Dialog>
					<TooltipProvider>
						<RouterProvider router={router} />
					</TooltipProvider>
				</Dialog>
			</ThemeProvider>
		</QueryClientProvider>
	</StrictMode>,
);

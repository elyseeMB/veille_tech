import { useLayoutEffect, useState } from "react";

export function useMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 600px)").matches,
  );

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia("(width <= 600px)");
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

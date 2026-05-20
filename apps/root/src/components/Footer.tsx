import { ModeToggle } from "./Mode-toggle.tsx";
import clsx from "clsx";
import { useMobile } from "@/hooks/useMobile.ts";
import { useEffect, useLayoutEffect, useRef } from "react";

export function Footer() {
  const isMobile = useMobile();
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Mesure immédiate avant le premier paint
    document.documentElement.style.setProperty(
      "--footer-height",
      `${el.getBoundingClientRect().height}px`,
    );

    const obs = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty(
        "--footer-height",
        `${entry.contentRect.height}px`,
      );
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <footer
      ref={ref}
      className={clsx(
        "fixed bottom-0 left-0 right-0 z-40",
        "px-6 lg:px-12 py-4 flex items-center justify-between",
        "bg-amber-500 backdrop-blur-md border-t border-border",
        isMobile && "border-x-0 -mx-4 px-4",
      )}
    >
      <div className="flex items-center gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Veille Tech — 2026
        </span>
        <ModeToggle />
      </div>

      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {new Date().toLocaleDateString("en", {
          day: "numeric",
          month: "long",
        })}
      </span>
    </footer>
  );
}

import { ModeToggle } from "./Mode-toggle.tsx";
import clsx from "clsx";
import { useMobile } from "@/hooks/useMobile.ts";

export function Footer() {
  const isMobile = useMobile();
  return (
    <footer
      className={clsx(
        "px-0 lg:px-5 py-4 flex items-center justify-between pt-6 -mb-10 border-x border-t border-border",
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

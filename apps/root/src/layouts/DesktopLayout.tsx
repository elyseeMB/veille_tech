import { Outlet, useSearchParams } from "react-router-dom";
import { ClustersPanel } from "@/components/ClustersPanel";
import { ClusterArticles } from "@/components/ClusterArticles";
import { SummaryPanel } from "@/components/SummaryPanel";
import { Calendar } from "@/components/Calendar";
import { Banner } from "@/components/BannerContext";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import { useCalendarToggle } from "@/hooks/useCalendarToggle";
import { useCalendarData } from "@/hooks/useCalendarData";
import { useContainerLeftOffset } from "@/hooks/useContainerLeftOffset";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/Mode-toggle";
import { Fullscreen } from "lucide-react";
import clsx from "clsx";

export function DesktopLayout() {
  const [searchParams] = useSearchParams();
  const clusterId = searchParams.get("cluster");
  const { ref: headerRef, height: headerHeight } = useHeaderHeight();
  const { visible: calendarVisible, toggle } = useCalendarToggle();
  const calendarData = useCalendarData();
  const { ref: containerRef, left: buttonLeft } = useContainerLeftOffset();

  return (
    <main
      className="min-h-screen bg-background"
      style={
        {
          "--header-height": `${calendarVisible ? headerHeight : 0}px`,
        } as React.CSSProperties
      }
    >
      <div
        ref={headerRef}
        className={clsx(
          "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md",
          "border-b border-border",
          calendarVisible ? "" : "h-0 pointer-events-none overflow-hidden",
        )}
        style={{ viewTransitionName: "calendar-header" }}
      >
        <div className="mx-auto max-w-5xl lg:px-12 pt-3 lg:pt-4 pb-0 lg:pb-2">
          <Calendar data={calendarData} />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-0 sm:px-6 lg:px-12 lg:pt-[var(--header-height)] transition-[padding-top] duration-150 ease-out">
        <Banner />

        <div ref={containerRef}>
          <div className="grid grid-cols-3">
            <ClustersPanel />
            <main className="overflow-y-auto scrollbar-hide border-r border-border h-[calc(100vh_-_var(--header-height)_-_var(--banner-height,_0px))]">
              {clusterId ? (
                <ClusterArticles id={clusterId} variant="desktop" />
              ) : (
                <Outlet />
              )}
            </main>
            <SummaryPanel />
          </div>
        </div>
      </div>

      <div
        className="fixed flex flex-col gap-0.5 top-[calc(var(--header-height)_+_0.5rem)] z-100"
        style={{ left: `${buttonLeft}px` }}
      >
        <Button variant="ghost" onClick={toggle} className="cursor-pointer">
          <Fullscreen size={16} />
        </Button>
        <ModeToggle />
      </div>
    </main>
  );
}

import { Outlet, useLocation, useNavigation } from "react-router";
import ClustersPanel from "@/components/ClustersPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { PageError } from "@/components/PageError.tsx";
import { ErrorBoundary } from "react-error-boundary";
import { ClusterSkeleton } from "@/components/ClusterArticles.tsx";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";

const AboutDialog = lazy(() => import("@/components/AboutDialog"));

export function DesktopLayout() {
  const location = useLocation();
  const isClustersList = location.pathname === "/clusters";
  const { ref: headerRef, height: headerHeight } = useHeaderHeight();
  const { visible: calendarVisible, toggle } = useCalendarToggle();
  const calendarData = useCalendarData();
  const { ref: containerRef, left: buttonLeft } = useContainerLeftOffset();

  const navigation = useNavigation();

  const showClusterSkeleton =
    navigation.state === "loading" &&
    navigation.location?.pathname?.startsWith("/clusters/");

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
          "fixed top-0 left-0 right-0 z-50 bg-background backdrop-blur-md",
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
              {showClusterSkeleton ? (
                <ClusterSkeleton />
              ) : isClustersList ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground px-5">
                    Select a cluster from the list
                  </p>
                </div>
              ) : (
                <ErrorBoundary FallbackComponent={PageError}>
                  <Outlet />
                </ErrorBoundary>
              )}
            </main>
            <HistoryPanel />
          </div>
        </div>
      </div>

      <div
        className="fixed flex flex-col gap-0.5 top-[calc(var(--header-height)_+_0.5rem)] z-100"
        style={{ left: `${buttonLeft}px` }}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                onClick={toggle}
                className="cursor-pointer text-muted-foreground/60 hover:text-foreground"
              >
                <Fullscreen size={16} />
              </Button>
            }
          />
          <TooltipContent side="right">
            <p>Fullscreen</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <span>
                <ModeToggle />
              </span>
            }
          />
          <TooltipContent side="right">
            <p>Theme</p>
          </TooltipContent>
        </Tooltip>

        <Suspense fallback={<Skeleton className="w-6 h-6 ml-2 rounded-lg" />}>
          <AboutDialog />
        </Suspense>
      </div>
    </main>
  );
}

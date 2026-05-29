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
import { Fullscreen, Info, InfoIcon } from "lucide-react";
import clsx from "clsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { PageError } from "@/components/PageError.tsx";
import { ErrorBoundary } from "react-error-boundary";
import { ClusterSkeleton } from "@/components/ClusterArticles.tsx";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";

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

        <Dialog>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                className="cursor-pointer text-muted-foreground/60 hover:text-foreground"
              >
                <Info />
              </Button>
            }
          />
          <DialogContent>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-muted">
                <InfoIcon />
              </div>
              <DialogHeader>
                <DialogTitle>About this project</DialogTitle>
              </DialogHeader>
            </div>
            <div className="-mx-4 no-scrollbar scrollbar-hide max-h-[50vh] overflow-y-auto px-4">
              <p className="mb-6 leading-normal text-muted-foreground">
                This project started from a simple desire: to stay informed
                differently. Honest critiques, human and authentic perspectives
                on tech.
              </p>

              <h3 className="mb-2 font-semibold">How it works</h3>
              <p className="mb-4 leading-normal text-muted-foreground">
                The pipeline runs in two stages.
              </p>
              <p className="mb-4 leading-normal text-muted-foreground">
                A fetcher collects public RSS feeds every 30 minutes. Each new
                article is vectorized — only its mathematical representation is
                stored, never the raw text.
              </p>
              <p className="mb-6 leading-normal text-muted-foreground">
                Twice a day, vectors are automatically grouped by topic and
                labeled by a language model. The result: a clean feed, grouped
                by theme, twice a day.
              </p>

              <h3 className="mb-2 font-semibold">Caveats</h3>
              <p className="mb-4 leading-normal text-muted-foreground">
                Clustering works best with enough article volume. Labels are
                generated automatically — they can sometimes be too broad. Treat
                them as a starting point, not ground truth.
              </p>

              <h3 className="mb-2 font-semibold">Who made this</h3>
              <p className="mb-4 leading-normal text-muted-foreground">
                I'm Elysée, a software engineer. You can find my other projects
                at{" "}
                <a
                  href="https://eembouz.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  eembouz.com
                </a>
              </p>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Close</Button>} />
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}

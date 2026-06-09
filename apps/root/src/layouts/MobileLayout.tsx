import { Outlet, useNavigation, useSearchParams } from "react-router";
import ExpandableTabs from "@/components/ExpandableTabs";
import { HistoryPanel } from "@/components/HistoryPanel";
import { Calendar } from "@/components/Calendar";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import { useCalendarData } from "@/hooks/useCalendarData";
import { Rss, Merge, Clock } from "lucide-react";
import { PageError } from "@/components/PageError.tsx";
import { ErrorBoundary } from "react-error-boundary";
import { ClusterSkeleton } from "@/components/ClusterArticles.tsx";

const tabs = [
  {
    name: "Feed",
    value: "feed",
    icon: <Rss className="size-4 shrink-0" />,
  },
  {
    name: "Topics",
    value: "topics",
    icon: <Merge className="size-4 shrink-0" />,
  },
  {
    name: "History",
    value: "history",
    icon: <Clock className="size-4 shrink-0" />,
  },
];

export function MobileLayout() {
  const [searchParams] = useSearchParams();
  const showHistory = searchParams.get("tab") === "history";
  const { ref: headerRef, height: headerHeight } = useHeaderHeight();
  const calendarData = useCalendarData();
  const navigation = useNavigation();

  const showClusterSkeleton =
    navigation.state === "loading" &&
    navigation.location?.pathname?.startsWith("/clusters/");

  const headerCss = {
    "--header-height": `${headerHeight}px`,
  } as React.CSSProperties;

  return (
    <main className="min-h-screen bg-background" style={headerCss}>
      <div
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-background backdrop-blur-md"
      >
        <div className="mx-auto max-w-5xl lg:px-12 pt-3 lg:pt-4 pb-0 lg:pb-2">
          <Calendar data={calendarData} />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-0 sm:px-6 lg:px-12 lg:pt-[var(--header-height)] pt-[calc(var(--tabs-height)_+_var(--header-height)_+_var(--cluster-back-height,_0px))]">
        <ExpandableTabs tabs={tabs} />
        {showHistory ? (
          <HistoryPanel />
        ) : showClusterSkeleton ? (
          <ClusterSkeleton />
        ) : (
          <ErrorBoundary FallbackComponent={PageError}>
            <Outlet />
          </ErrorBoundary>
        )}
      </div>
    </main>
  );
}

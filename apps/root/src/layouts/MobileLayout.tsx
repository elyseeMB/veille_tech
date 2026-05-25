import { Outlet, useSearchParams } from "react-router-dom";
import ExpandableTabs from "@/components/ExpandableTabs";
import { ClustersPanel } from "@/components/ClustersPanel";
import { SummaryPanel } from "@/components/SummaryPanel";
import { ClusterArticles } from "@/components/ClusterArticles";
import { TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/Calendar";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import { useCalendarData } from "@/hooks/useCalendarData";
import { Rss, Merge, HeartIcon } from "lucide-react";

const tabs = [
  {
    name: "Feed",
    value: "feed",
    icon: <Rss className="size-4 shrink-0" />,
  },
  {
    name: "Clusters",
    value: "clusters",
    icon: <Merge className="size-4 shrink-0" />,
  },
  {
    name: "Summary",
    value: "summary",
    icon: <HeartIcon className="size-4 shrink-0" />,
  },
];

const panels: Record<string, React.ReactNode> = {
  feed: <Outlet />,
  clusters: <ClustersPanel />,
  summary: <SummaryPanel />,
};

export function MobileLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clusterId = searchParams.get("cluster");
  const { ref: headerRef, height: headerHeight } = useHeaderHeight();
  const calendarData = useCalendarData();

  const headerCss = { "--header-height": `${headerHeight}px` } as React.CSSProperties;

  return (
    <main className="min-h-screen bg-background" style={headerCss}>
      <div
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md"
      >
        <div className="mx-auto max-w-5xl lg:px-12 pt-3 lg:pt-4 pb-0 lg:pb-2">
          <Calendar data={calendarData} />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-0 sm:px-6 lg:px-12 lg:pt-[var(--header-height)] pt-[calc(var(--tabs-height)_+_var(--header-height)_+_var(--cluster-back-height,_0px))]">
        <ExpandableTabs tabs={tabs}>
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {(tab.value === "feed" || tab.value === "clusters") && clusterId ? (
                <ClusterArticles id={clusterId} variant="mobile" setSearchParams={setSearchParams} />
              ) : (
                panels[tab.value]
              )}
            </TabsContent>
          ))}
        </ExpandableTabs>
      </div>
    </main>
  );
}

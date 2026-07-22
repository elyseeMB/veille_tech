import { Calendar } from "@/components/Calendar";
import { ClusterSkeleton } from "@/components/ClusterArticles.tsx";
import ExpandableTabs from "@/components/ExpandableTabs";
import { HistoryPanel } from "@/components/HistoryPanel";
import { PageError } from "@/components/PageError.tsx";
import { useCalendarData } from "@/hooks/useCalendarData";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import { Rss, Merge, Clock } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useNavigation, useSearchParams } from "react-router";

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

	const showClusterSkeleton = navigation.state === "loading" && navigation.location?.pathname?.startsWith("/clusters/");

	const headerCss = {
		"--header-height": `${headerHeight}px`,
	} as React.CSSProperties;

	return (
		<main className="bg-background min-h-screen" style={headerCss}>
			<div ref={headerRef} className="bg-background fixed top-0 right-0 left-0 z-50 backdrop-blur-md">
				<div className="mx-auto max-w-5xl pt-3 pb-0 lg:px-12 lg:pt-4 lg:pb-2">
					<Calendar data={calendarData} />
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-4 pt-[calc(var(--tabs-height)_+_var(--header-height)_+_var(--cluster-back-height,_0px))] sm:px-6 md:px-0 lg:px-12 lg:pt-[var(--header-height)]">
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

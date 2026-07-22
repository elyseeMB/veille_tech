import { Banner } from "@/components/BannerContext";
import { Calendar } from "@/components/Calendar";
import { ClusterSkeleton } from "@/components/ClusterArticles.tsx";
import ClustersPanel from "@/components/ClustersPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { ModeToggle } from "@/components/Mode-toggle";
import { PageError } from "@/components/PageError.tsx";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { useCalendarData } from "@/hooks/useCalendarData";
import { useCalendarToggle } from "@/hooks/useCalendarToggle";
import { useContainerLeftOffset } from "@/hooks/useContainerLeftOffset";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import clsx from "clsx";
import { Fullscreen } from "lucide-react";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet, useLocation, useNavigation } from "react-router";

const AboutDialog = lazy(() => import("@/components/AboutDialog"));

export function DesktopLayout() {
	const location = useLocation();
	const isClustersList = location.pathname === "/clusters";
	const { ref: headerRef, height: headerHeight } = useHeaderHeight();
	const { visible: calendarVisible, toggle } = useCalendarToggle();
	const calendarData = useCalendarData();
	const { ref: containerRef, left: buttonLeft } = useContainerLeftOffset();

	const navigation = useNavigation();

	const showClusterSkeleton = navigation.state === "loading" && navigation.location?.pathname?.startsWith("/clusters/");

	return (
		<div
			className="bg-background min-h-screen"
			style={
				{
					"--header-height": `${calendarVisible ? headerHeight : 0}px`,
				} as React.CSSProperties
			}
		>
			<div
				ref={headerRef}
				className={clsx(
					"bg-background fixed top-0 right-0 left-0 z-50 backdrop-blur-md",
					"border-border border-b",
					calendarVisible ? "" : "pointer-events-none h-0 overflow-hidden",
				)}
				style={{ viewTransitionName: "calendar-header" }}
			>
				<div className="mx-auto max-w-5xl pt-3 pb-0 lg:px-12 lg:pt-4 lg:pb-2">
					<Calendar data={calendarData} />
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-4 transition-[padding-top] duration-150 ease-out sm:px-6 md:px-0 md:pt-[var(--header-height)] lg:px-12">
				<Banner />

				<div ref={containerRef}>
					<div className="grid grid-cols-3">
						<ClustersPanel />
						<main className="scrollbar-hide border-border h-[calc(100vh_-_var(--header-height)_-_var(--banner-height,_0px))] overflow-y-auto border-r">
							{showClusterSkeleton ? (
								<ClusterSkeleton />
							) : isClustersList ? (
								<div className="flex h-full items-center justify-center">
									<p className="text-muted-foreground px-5 text-sm">Select a cluster from the list</p>
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
				className="fixed top-[calc(var(--header-height)_+_0.5rem)] z-100 flex flex-col gap-0.5"
				style={{ left: `${buttonLeft}px` }}
			>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								variant="ghost"
								onClick={toggle}
								className="text-muted-foreground/60 hover:text-foreground cursor-pointer"
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

				<Suspense fallback={<Skeleton className="ml-2 h-6 w-6 rounded-lg" />}>
					<AboutDialog />
				</Suspense>
			</div>
		</div>
	);
}

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { clustersQuery } from "@/queries";
import { useSummaryStore } from "@/store/summaryStore.ts";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect } from "react";
import { matchPath, useLocation, useNavigate } from "react-router";
import { useBanner } from "./BannerContext.tsx";
import { SourcesBadge } from "./SourcesBadge.tsx";
import { TimeRelative } from "./TimeRelative.tsx";
import { Button } from "./ui/button.tsx";

function ClusterCard({
	label,
	createdAt,
	articleCount,
	sources,
	description,
	selected,
	onSelect,
	isMobile,
}: {
	label: string;
	createdAt: string;
	articleCount: number;
	sources: { name: string; baseUrl: string; type: string }[];
	description?: string;
	selected: boolean;
	onSelect: () => void;
	isMobile: boolean;
}) {
	return (
		<div
			className={clsx(
				"border-border flex cursor-pointer flex-col gap-2 border-b transition-colors last:border-0",
				isMobile ? "-mx-[1rem] w-[calc(100%_+_2rem)] px-[1rem] py-5" : "p-5",
				selected ? "bg-foreground/10" : "hover:bg-foreground/5",
			)}
			onClick={onSelect}
		>
			<div className="flex min-w-0 flex-col gap-1">
				<div className="mb-1 flex items-center gap-2">
					<TimeRelative date={createdAt} className="text-sm" />
					<span>·</span>
					<span className="flex items-center gap-1 text-sm">{articleCount} articles</span>
				</div>
				<div className="flex w-fit items-center gap-2 font-sans text-lg font-medium">{label}</div>
				{sources.length > 0 && (
					<div className="mt-2">
						<SourcesBadge sources={sources} />
					</div>
				)}
			</div>
			{description && <p className="text-muted-foreground text-lg leading-relaxed lg:text-base">{description}</p>}
		</div>
	);
}

export default function ClustersPanel() {
	const isMobile = useMediaQuery("(max-width: 768px)");
	const { data: clusters, error, refetch } = useQuery(clustersQuery);
	const navigate = useNavigate();
	const location = useLocation();
	const clusterMatch = matchPath("/clusters/:id", location.pathname);
	const selectedClusterId = clusterMatch?.params.id ?? null;
	const { pushBanner } = useBanner();
	const { setSelectedArticle } = useSummaryStore();

	const handleSelect = (id: string) => {
		const isSelected = selectedClusterId === id;
		if (!isSelected) {
			const cluster = clusters?.find((c) => c.id === id);
			if (cluster) {
				setSelectedArticle(null);
				pushBanner({
					title: cluster.label,
					source: "Cluster",
					pubDate: cluster.createdAt,
					node: null,
				});
			}
			navigate(`/clusters/${id}`);
		} else {
			pushBanner(null);
			navigate("/feed");
		}
	};

	useEffect(() => {
		if (selectedClusterId && clusters) {
			const cluster = clusters.find((c) => c.id === selectedClusterId);
			if (cluster) {
				pushBanner({
					title: cluster.label,
					source: "Cluster",
					pubDate: cluster.createdAt,
					node: null,
				});
			}
		}
	}, [clusters, selectedClusterId, pushBanner]);

	return (
		<aside
			className={clsx(
				!isMobile &&
					"border-border scrollbar-hide h-[calc(100vh-var(--header-height)-var(--banner-height,0px))] overflow-y-auto border-r border-l",
			)}
		>
			{error ? (
				<div className="flex items-center justify-center p-2">
					<Button className="cursor-pointer" variant="outline" onClick={() => refetch()}>
						Failed to load clusters — Tap to retry
					</Button>
				</div>
			) : !clusters || clusters.length === 0 ? (
				<p className="text-muted-foreground px-5 py-5 text-sm">No clusters yet.</p>
			) : (
				clusters.map((cluster) => (
					<ClusterCard
						key={cluster.id}
						label={cluster.label}
						createdAt={cluster.createdAt}
						articleCount={cluster.articleCount}
						sources={cluster.sources}
						description={cluster.description}
						selected={selectedClusterId === cluster.id}
						onSelect={() => handleSelect(cluster.id)}
						isMobile={isMobile}
					/>
				))
			)}
		</aside>
	);
}

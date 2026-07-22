import { ArticleItem } from "@/components/ArticleItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoItem } from "@/components/VideoItem";
import { useMediaQuery } from "@/hooks/useMediaQuery.ts";
import { clusterQuery } from "@/queries";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import { useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router";
import { Seo } from "./Seo.tsx";

export function ClusterSkeleton() {
	const isMobile = useMediaQuery("(max-width: 768px)");
	return (
		<div className={clsx("flex flex-col gap-4 p-5", isMobile && "-mx-[1rem] w-[calc(100%_+_2rem)] px-[1rem]")}>
			<Skeleton className="bg-muted h-5 w-2/3" />
			<Skeleton className="bg-muted h-3 w-1/3" />
			<Skeleton className="bg-muted h-20 w-full" />
			{Array.from({ length: 3 }).map((_, i) => (
				<Skeleton key={i} className="bg-muted h-16 w-full" />
			))}
		</div>
	);
}

export function ClusterArticles({ id, variant }: { id: string; variant: "mobile" | "desktop" }) {
	const { data, isLoading } = useQuery(clusterQuery(id));
	const navigate = useNavigate();
	const backRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const el = backRef.current;
		if (!el || variant !== "mobile") {
			document.documentElement.style.setProperty("--cluster-back-height", "0px");
			return;
		}

		const measure = () => {
			document.documentElement.style.setProperty("--cluster-back-height", `${el.getBoundingClientRect().height}px`);
		};

		measure();
		const obs = new ResizeObserver(measure);
		obs.observe(el);

		return () => {
			obs.disconnect();
			document.documentElement.style.setProperty("--cluster-back-height", "0px");
		};
	}, [variant, data]);

	if (isLoading) {
		return <ClusterSkeleton />;
	}
	if (!data) return <p className="text-muted-foreground p-5 text-sm">Cluster not found.</p>;

	return (
		<div className="flex flex-col">
			{variant === "mobile" && (
				<div
					ref={backRef}
					className="bg-background before:from-background fixed top-[calc(var(--tabs-height)_+_var(--header-height))] left-0 z-50 w-full px-4 pt-3 before:pointer-events-none before:absolute before:inset-x-0 before:top-full before:h-6 before:bg-gradient-to-b before:from-30% before:to-transparent before:content-['']"
				>
					<Button
						variant="ghost"
						className="bg-primary-foreground h-13 w-full cursor-pointer rounded-full"
						onClick={() => navigate("/clusters")}
					>
						<ArrowLeft size={18} />
						<span className="text-sm font-medium">{data.label}</span>
					</Button>
				</div>
			)}

			{data.items.map((item) =>
				item.type === "article" ? (
					<>
						<Seo title={`Cluster | ${data.label}`} url={`https://veille.safecoffi.app/cluster/${data.id}`} />
						<ArticleItem
							key={item.data.id}
							article={item.data}
							clusterLabel={data.label}
							clusterCreatedAt={data.createdAt}
						/>
					</>
				) : (
					<VideoItem key={item.data.id} video={item.data} />
				),
			)}
		</div>
	);
}

import clsx from "clsx";
import { Fragment, lazy, Suspense, useEffect, useRef } from "react";
import { ArticleItem } from "./ArticleItem.tsx";
import { Button } from "./ui/button.tsx";
import { Skeleton } from "./ui/skeleton.tsx";
import { VideoItem } from "./VideoItem.tsx";
import type { FeedItem } from "@/types";

const VideoCarouselLazy = lazy(() => import("@/components/VideoCarousel"));

export function Feed({
	items,
	loading,
	loadingMore,
	hasMore,
	loadMore,
	error,
	retry,
}: {
	items: FeedItem[];
	loading: boolean;
	loadingMore: boolean;
	hasMore: boolean;
	loadMore: () => void;
	error?: string | null;
	retry?: () => void;
}) {
	const sentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!sentinelRef.current) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loadingMore) {
					loadMore();
				}
			},
			{ threshold: 0, rootMargin: "700px" },
		);
		observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}, [hasMore, loadingMore, loadMore]);

	const getComponent = (item: FeedItem) => {
		switch (item.type) {
			case "article":
				return <ArticleItem article={item.data} />;
			case "video":
				return <VideoItem video={item.data} />;
			case "video_carousel":
				return item.data.length === 1 ? (
					<VideoItem video={item.data[0]} />
				) : (
					<Suspense fallback={<CarouselSkeleton />}>
						<VideoCarouselLazy group={item.data} />
					</Suspense>
				);
			default:
				return <div>No Content</div>;
		}
	};

	return (
		<section>
			<h2 className="sr-only">Feed</h2>
			{loading ? (
				Array.from({ length: 5 }).map((_, i) => <ItemSkeleton2 key={i} />)
			) : items.length === 0 && !error ? (
				<p className="text-muted-foreground py-5 text-sm">Nothing yet.</p>
			) : (
				<>
					{items.map((item, i) => (
						<Fragment key={item.date.toString()}>
							{getComponent(item)}
							{i === items.length - 3 && hasMore && <div ref={sentinelRef} aria-hidden="true" />}
						</Fragment>
					))}
					{loadingMore && <ItemSkeleton />}
				</>
			)}
			{error && (
				<div className="flex items-center justify-center p-2">
					<Button className="cursor-pointer" variant="outline" onClick={retry}>
						{error} — Tap to retry
					</Button>
				</div>
			)}
		</section>
	);
}

function ItemSkeleton() {
	return (
		<div
			className={clsx(
				"border-border -mx-[1rem] flex w-[calc(100%_+_2rem)] flex-col gap-5 border-b p-4 lg:mx-0 lg:w-full lg:border-l lg:p-5",
			)}
		>
			<div className="space-y-3">
				<Skeleton className="bg-muted h-3 w-20" />
				<Skeleton className="bg-muted h-5 w-4/5" />
			</div>
		</div>
	);
}

export function ItemSkeleton2() {
	return (
		<div
			className={clsx(
				"border-border -mx-[1rem] flex w-[calc(100%_+_2rem)] flex-col gap-5 border-b p-4 last:border-0 lg:mx-0 lg:w-full lg:border-l lg:p-5",
			)}
		>
			<div className="space-y-3">
				<Skeleton className="bg-muted h-3 w-20" />
				<Skeleton className="bg-muted h-5 w-4/5" />
				<Skeleton className="bg-foreground/10 h-15 w-full" />
			</div>
		</div>
	);
}

function CarouselSkeleton() {
	return (
		<div className="border-border mb-9 grid grid-cols-[1px_1fr] gap-5 border-b py-5 pr-5">
			<div className="space-y-3">
				<Skeleton className="bg-muted h-3 w-20" />
				<Skeleton className="bg-muted h-5 w-4/5" />
				<Skeleton className="bg-muted h-40 w-full" />
			</div>
		</div>
	);
}

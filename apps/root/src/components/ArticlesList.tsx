import { useEffect, useRef } from "react";
import { TimeRelative } from "./TimeRelative.tsx";
import { Skeleton } from "./ui/skeleton.tsx";

export type Article = {
	id: string;
	title: string;
	link: string;
	author: string;
	pubDate: string;
	content?: string;
	source: string;
	category: string;
};

const SOURCE_COLORS: Record<string, string> = {
	"Hacker News": "text-orange-400",
	"The Verge": "text-violet-400",
	"Ars Technica": "text-red-400",
	"MIT Tech Review": "text-blue-400",
	Wired: "text-emerald-400",
	"Nasdaq Nordic News Releases": "text-[#0098b9]",
	TechCrunch: "text-[#68f176]",
};

export function ArticlesList({
	articles,
	loading,
	loadingMore,
	hasMore,
	loadMore,
}: {
	articles: Article[];
	loading: boolean;
	loadingMore: boolean;
	hasMore: boolean;
	loadMore: () => void;
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
			{ threshold: 0.1 },
		);

		observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}, [hasMore, loadingMore, loadMore]);

	return (
		<div className="space-y-0">
			{loading ? (
				Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="border-border mb-9 grid grid-cols-[1px_1fr] gap-5 border-b py-5 pr-5 last:border-0">
						<Skeleton className="bg-muted h-full" />
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<Skeleton className="bg-muted h-3 w-20" />
								<Skeleton className="bg-foreground/10 h-px flex-1" />
								<Skeleton className="bg-muted h-3 w-16" />
							</div>
							<Skeleton className="bg-muted h-5 w-4/5" />
							<Skeleton className="bg-foreground/10 h-4 w-full" />
							<Skeleton className="bg-foreground/10 h-4 w-2/3" />
						</div>
					</div>
				))
			) : articles.length === 0 ? (
				<p className="text-muted-foreground py-5 text-sm">No articles yet.</p>
			) : (
				<div>
					{articles.map((item) => (
						<article
							key={item.id}
							className="group border-border hover:bg-foreground/5 relative -mx-[1rem] grid w-[calc(100%_+_2rem)] grid-cols-1 gap-5 overflow-hidden border-b p-4 transition-colors last:border-0 lg:mx-0 lg:w-full lg:grid-cols-[1px_1fr] lg:py-5 lg:pr-5 lg:pl-0"
						>
							<div className="bg-muted group-hover:bg-foreground opacity-0 transition-colors group-hover:opacity-100" />
							<div className="w-full space-y-3">
								<div className="flex flex-col items-start gap-1">
									<TimeRelative date={item.pubDate} />
									<div className="flex items-center gap-2">
										<span
											className={`text-xs tracking-widest uppercase ${
												SOURCE_COLORS[item.source] ?? "text-muted-foreground"
											}`}
										>
											{item.source}
										</span>
										<span>·</span>
										<span className="text-muted-foreground/60 text-xs capitalize">{item.category}</span>
									</div>
								</div>

								<div className="text-muted-foreground flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] uppercase">
									<span>{item.author}</span>
									<span className="bg-foreground/10 h-px flex-1" />
									<time>
										{new Date(item.pubDate).toLocaleDateString("en", {
											year: "numeric",
											day: "numeric",
											month: "short",
										})}
									</time>
								</div>

								<a
									href={`/r/${item.id}?title=${encodeURIComponent(item.title)}&url=${encodeURIComponent(item.link)}&source=${encodeURIComponent(item.source)}&sourceBaseUrl=${encodeURIComponent(new URL(item.link).hostname)}`}
									className="block before:absolute before:inset-0 before:h-full before:w-full before:content-['']"
									target="_blank"
									rel="noreferrer"
								>
									<h2 className="text-foreground group-hover:text-muted-foreground text-lg leading-snug font-medium tracking-[-0.01em] transition-colors">
										{item.title}
									</h2>
								</a>

								{item.content && !item.content.includes("Comments URL:") && (
									<p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
										{item.content.replace(/<[^>]*>/g, "").slice(0, 140)}…
									</p>
								)}
							</div>
						</article>
					))}

					<div ref={sentinelRef} className="py-1" />

					{loadingMore && (
						<div className="border-border grid grid-cols-[1px_1fr] gap-5 border-b py-5 pr-5">
							<Skeleton className="bg-muted h-full" />
							<div className="space-y-3">
								<Skeleton className="bg-muted h-3 w-20" />
								<Skeleton className="bg-muted h-5 w-4/5" />
								<Skeleton className="bg-foreground/10 h-4 w-2/3" />
							</div>
						</div>
					)}

					{/* Fin du feed */}
					{!hasMore && articles.length > 0 && (
						<p className="text-muted-foreground/40 py-8 text-center font-mono text-xs tracking-widest uppercase">
							— fin —
						</p>
					)}
				</div>
			)}
		</div>
	);
}

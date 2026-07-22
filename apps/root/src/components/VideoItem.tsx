import { useMediaQuery } from "@/hooks/useMediaQuery";
import clsx from "clsx";
import { useRef } from "react";
import { TimeRelative } from "./TimeRelative.tsx";
import type { YoutubeVideo } from "@/types";

export function VideoItem({ video: item }: { video: YoutubeVideo }) {
	const isMobile = useMediaQuery("(max-width: 768px)");
	const articleRef = useRef<HTMLElement>(null);
	const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";

	return (
		<article
			ref={articleRef}
			className={clsx(
				"border-border hover:bg-foreground/5 relative -mx-[1rem] w-[calc(100%_+_2rem)] border-b transition-colors md:mx-0 md:w-full lg:mx-0 lg:w-full",
			)}
		>
			<div className={clsx(!isMobile && "grid grid-cols-[1fr] gap-5")}>
				<div className="flex min-w-0 flex-1 flex-col gap-3">
					<a
						href={`https://www.youtube.com/watch?v=${item.externalId}`}
						target="_blank"
						rel="noreferrer"
						className="relative block aspect-video overflow-hidden"
					>
						<img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
						<div className="group absolute inset-0 flex flex-col justify-end gap-1.5 bg-gradient-to-t from-black/100 via-black/50 to-transparent p-4 lg:px-5">
							<div className="flex items-start gap-2">
								{item.channelAvatar && (
									<img
										className="size-12 rounded-full object-cover md:max-lg:size-8"
										src={item.channelAvatar.startsWith("http") ? item.channelAvatar : `${API_URL}${item.channelAvatar}`}
										alt={item.channelTitle}
									/>
								)}
								<div>
									<h3 className="line-clamp-2 text-lg leading-tight font-medium text-white/90 transition group-hover:text-white md:max-lg:text-sm">
										{item.title}
									</h3>
									<div className="flex items-center gap-2">
										<span className="font-medium text-white/90 md:max-lg:text-sm">{item.channelTitle}</span>
										<TimeRelative date={item.publishedAt} className="text-white/70 md:max-lg:text-xs" />
									</div>
								</div>
							</div>
						</div>
					</a>
				</div>
			</div>
		</article>
	);
}

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import clsx from "clsx";
import Autoplay from "embla-carousel-autoplay";
import { TimeRelative } from "./TimeRelative.tsx";
import type { YoutubeVideo } from "@/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";

export default function VideoCarousel({ group }: { group: YoutubeVideo[] }) {
	const isMobile = useMediaQuery("(max-width: 768px)");

	return (
		<section
			aria-labelledby="carousel-video-yt"
			role="region"
			className={clsx(isMobile && "-mx-[1rem] w-[calc(100%_+_2rem)]", "border-b py-5")}
		>
			<Carousel
				className="w-full overflow-hidden px-4"
				opts={{
					align: "center",
					loop: true,
				}}
				plugins={[
					Autoplay({
						delay: 4000,
					}),
				]}
			>
				<CarouselContent>
					{group.map((video, index) => (
						<CarouselItem key={index} className="basis-[70%]">
							<div className="p-1">
								<a
									href={`https://www.youtube.com/watch?v=${video.externalId}`}
									target="_blank"
									rel="noreferrer"
									className="relative block aspect-video overflow-hidden rounded-md"
								>
									<img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
									<div className="group absolute inset-0 flex flex-col justify-end gap-1.5 bg-gradient-to-t from-black/100 via-black/50 to-transparent p-3">
										<div className="flex items-start gap-2">
											{video.channelAvatar && (
												<img
													className="size-6 rounded-full object-cover md:max-lg:size-5"
													src={
														video.channelAvatar.startsWith("http")
															? video.channelAvatar
															: `${API_URL}${video.channelAvatar}`
													}
													alt=""
												/>
											)}
											<div className="flex flex-col">
												<h3 className="line-clamp-2 text-sm leading-tight font-medium text-white/90 transition group-hover:text-white md:max-lg:text-[10px]">
													{video.title}
												</h3>
												<div className="flex items-center gap-1">
													<span className="text-[10px] font-medium text-white md:max-lg:text-[8px]">
														{video.channelTitle}
													</span>
													<TimeRelative
														date={video.publishedAt}
														className="text-[10px] text-white/80 md:max-lg:text-[8px]"
													/>
												</div>
											</div>
										</div>
									</div>
								</a>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious
					variant="default"
					size="icon-lg"
					className="hover:bg-accent-foreground inset-y-0 left-1 z-30 my-auto hidden sm:flex"
				/>
				<CarouselNext
					variant="default"
					size="icon-lg"
					className="hover:bg-accent-foreground inset-y-0 right-1 z-30 my-auto hidden sm:flex"
				/>
			</Carousel>
		</section>
	);
}

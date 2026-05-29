import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import Autoplay from "embla-carousel-autoplay";
import type { YoutubeVideo } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import clsx from "clsx";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";

export default function VideoCarousel({ group }: { group: YoutubeVideo[] }) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <section
      aria-labelledby="carousel-video-yt"
      role="region"
      className={clsx(
        isMobile && "w-[calc(100%_+_2rem)] -mx-[1rem]",
        "border-b py-5",
      )}
    >
      <Carousel
        className="w-full overflow-hidden"
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
                  className="group relative block overflow-hidden rounded-md aspect-video"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end gap-1.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex items-center gap-2">
                      {video.channelAvatar && (
                        <img
                          className="size-6 rounded-full object-cover"
                          src={
                            video.channelAvatar.startsWith("http")
                              ? video.channelAvatar
                              : `${API_URL}${video.channelAvatar}`
                          }
                          alt=""
                        />
                      )}
                      <span className="text-[10px] font-medium text-white/80">
                        {video.channelTitle}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white line-clamp-2">
                      {video.title}
                    </h3>
                  </div>
                </a>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious
          variant="default"
          size="icon-lg"
          className="hidden sm:flex inset-y-0 my-auto left-1 z-30 hover:bg-accent-foreground"
        />
        <CarouselNext
          variant="default"
          size="icon-lg"
          className="hidden sm:flex inset-y-0 my-auto right-1 z-30 hover:bg-accent-foreground"
        />
      </Carousel>
    </section>
  );
}

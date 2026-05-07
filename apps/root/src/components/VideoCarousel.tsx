import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel.tsx";
import { VideoItem } from "./VideoItem.tsx";

import Autoplay from "embla-carousel-autoplay";
import type { YoutubeVideo } from "./VideosCard.tsx";
import { useMobile } from "@/hooks/useMobile.ts";
import clsx from "clsx";

export default function VideoCarousel({ group }: { group: YoutubeVideo[] }) {
  const isMobile = useMobile();
  return (
    <section
      aria-labelledby="carousel-video-yt"
      role="region"
      className="border-b"
    >
      <Carousel
        className="w-full overflow-hidden "
        opts={{
          loop: true,
          align: "start",
        }}
        plugins={[
          Autoplay({
            delay: 4000,
          }),
        ]}
      >
        <CarouselContent>
          {group.map((video, index) => (
            <CarouselItem
              className={clsx(
                "basis-[75%] first:-ml-0 -ml-5",
                isMobile && "border-none pr-5 -ml-0",
              )}
              key={index}
            >
              <VideoItem key={video.id} video={video} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious
          variant="default"
          size="icon-lg"
          className="hidden sm:flex top-[50%] left-1 z-30 transform-none hover:bg-accent-foreground"
        />
        <CarouselNext
          variant="default"
          size="icon-lg"
          className="hidden sm:flex top-[50%] right-1 z-30 transform-none hover:bg-accent-foreground"
        />
      </Carousel>
    </section>
  );
}

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

export default function VideoCarousel({ group }: { group: YoutubeVideo[] }) {
  return (
    <Carousel
      className="w-full overflow-hidden border-b"
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
            className="basis-[85%] border-r first:-ml-0 -ml-5"
            key={index}
          >
            <VideoItem key={video.id} video={video} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious
        variant="default"
        size="icon-lg"
        className="hidden sm:flex left-1 z-50 transform-none hover:bg-accent-foreground"
      />
      <CarouselNext
        variant="default"
        size="icon-lg"
        className="hidden sm:flex right-1 z-50 transform-none hover:bg-accent-foreground"
      />
    </Carousel>
  );
}

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
      opts={{
        loop: true,
        align: "start",
      }}
      plugins={[
        Autoplay({
          delay: 4000,
        }),
      ]}
      className="w-full"
    >
      <CarouselContent>
        {group.map((video, index) => (
          <CarouselItem key={index}>
            <VideoItem key={video.id} video={video} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious
        variant="default"
        size="icon-lg"
        className="left-1 z-50 transform-none hover:bg-accent-foreground"
      />
      <CarouselNext
        variant="default"
        size="icon-lg"
        className="right-1 z-50 transform-none hover:bg-accent-foreground"
      />
    </Carousel>
  );
}

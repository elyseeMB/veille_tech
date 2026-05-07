package models

func ChunkVideosIntoCarousel(dtos []VideoDTO, groupSize int) []VideoCarouselGroup {
	if groupSize <= 0 {
		groupSize = 5
	}

	groups := make([]VideoCarouselGroup, 0, (len(dtos)+groupSize-1)/groupSize)

	for i := 0; i < len(dtos); i += groupSize {
		end := i + groupSize
		if end > len(dtos) {
			end = len(dtos)
		}
		chunk := dtos[i:end]

		groups = append(groups, VideoCarouselGroup{
			PubDate: chunk[0].PublishedAt,
			Items:   chunk,
		})
	}

	return groups
}

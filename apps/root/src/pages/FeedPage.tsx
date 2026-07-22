import { Feed } from "@/components/Feed";
import { feedQuery } from "@/queries";
import { useInfiniteQuery } from "@tanstack/react-query";

export default function FeedPage() {
	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error, refetch } =
		useInfiniteQuery(feedQuery);

	const items = data?.pages.flatMap((p) => p.items) ?? [];
	const loading = isLoading;
	const loadingMore = isFetchingNextPage;
	const hasMore = hasNextPage ?? false;
	const loadMore = () => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	};

	return (
		<Feed
			items={items}
			loading={loading}
			loadingMore={loadingMore}
			hasMore={hasMore}
			loadMore={loadMore}
			error={error ? "Connexion perdue. Réessaie plus tard." : null}
			retry={() => refetch()}
		/>
	);
}

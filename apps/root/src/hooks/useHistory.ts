import { db } from "@/lib/db";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useHistory() {
	const queryClient = useQueryClient();

	const { data: clicks = [], isLoading } = useQuery({
		queryKey: ["history"],
		queryFn: () => db.getRecentClicks(50),
		staleTime: 0,
		refetchOnWindowFocus: true,
	});

	const clearHistory = async () => {
		await db.clearClicks();
		queryClient.invalidateQueries({ queryKey: ["history"] });
		queryClient.invalidateQueries({ queryKey: ["readArticles"] });
	};

	return { clicks, clearHistory, isLoading };
}

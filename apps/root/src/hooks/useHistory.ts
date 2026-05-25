import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";

export function useHistory() {
  const queryClient = useQueryClient();

  const { data: clicks = [] } = useQuery({
    queryKey: ["history"],
    queryFn: () =>
      db.clicks.orderBy("clickedAt").reverse().limit(50).toArray(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const clearHistory = async () => {
    await db.clicks.clear();
    queryClient.invalidateQueries({ queryKey: ["history"] });
  };

  return { clicks, clearHistory };
}

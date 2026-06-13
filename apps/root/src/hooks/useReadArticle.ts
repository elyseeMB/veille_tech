import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";

export function useReadArticles() {
  const { data: readIds = new Set<string>() } = useQuery({
    queryKey: ["readArticles"],
    queryFn: () => db.getAllArticleIds(),
    staleTime: 0,
  });

  return readIds;
}

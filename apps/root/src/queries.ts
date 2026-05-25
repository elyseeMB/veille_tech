import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { fetchFeed } from "@/api/feed";
import { fetchCluster, fetchClusters } from "@/api/cluster";

const url = import.meta.env.PROD
  ? "https://api.veille.safecoffi.app/v1"
  : "http://localhost:8081/v1";

export const feedQuery = infiniteQueryOptions({
  queryKey: ["feed"],
  queryFn: ({ pageParam = 1 }) => fetchFeed(url, pageParam),
  initialPageParam: 1,
  getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
});

export const clustersQuery = queryOptions({
  queryKey: ["clusters"],
  queryFn: () => fetchClusters(url),
  staleTime: 1000 * 60 * 60 * 24,
  gcTime: 1000 * 60 * 60 * 48,
});

export const clusterQuery = (id: string) =>
  queryOptions({
    queryKey: ["cluster", id],
    queryFn: () => fetchCluster(url, id),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 48,
  });

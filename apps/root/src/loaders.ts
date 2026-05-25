import { queryClient } from "@/queryClient";
import { feedQuery, clusterQuery } from "@/queries";
import type { LoaderFunctionArgs } from "react-router-dom";

export async function feedLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const clusterId = url.searchParams.get("cluster");

  await queryClient.ensureInfiniteQueryData(feedQuery);

  if (clusterId) {
    await queryClient.ensureQueryData(clusterQuery(clusterId));
  }

  return null;
}

export async function clusterLoader({ params }: LoaderFunctionArgs) {
  const id = params.id as string;
  await queryClient.ensureQueryData(clusterQuery(id));
  return null;
}

import { queryClient } from "@/queryClient";
import { feedQuery, clusterQuery } from "@/queries";
import type { LoaderFunctionArgs } from "react-router-dom";

export async function feedLoader(_: LoaderFunctionArgs) {
  await queryClient.ensureInfiniteQueryData(feedQuery);

  return null;
}

export async function clusterLoader({ params }: LoaderFunctionArgs) {
  const id = params.id as string;
  await queryClient.ensureQueryData(clusterQuery(id));
  return null;
}

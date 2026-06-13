import { RootLayout } from "@/layouts/RootLayout";
import { clusterLoader, clustersLoader, feedLoader } from "@/loaders";
import { lazy, Suspense, type FC, type LazyExoticComponent } from "react";
import {
  createBrowserRouter,
  redirect,
  type LoaderFunction,
  type RouteObject,
} from "react-router";
import { PageError } from "./components/PageError.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { queryClient } from "./queryClient.ts";
import { clustersQuery } from "./queries.ts";

type AppRoute = {
  Component?: FC<any> | LazyExoticComponent<FC<any>>;
  fallback?: FC;
  loader?: LoaderFunction;
  children?: AppRoute[];
} & Omit<RouteObject, "Component" | "children">;

const routes: AppRoute[] = [
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary: ErrorBoundary,
    loader: async () => {
      await queryClient.ensureQueryData(clustersQuery);
      return null;
    },
    children: [
      { index: true, loader: () => redirect("/feed") },
      {
        path: "feed",
        Component: lazy(() => import("@/pages/FeedPage")),
        loader: feedLoader,
      },
      {
        path: "clusters",
        Component: lazy(() => import("@/components/ClustersPanel")),
        loader: clustersLoader,
      },
      {
        path: "clusters/:id",
        Component: lazy(() => import("@/pages/ClusterSection")),
        loader: clusterLoader,
      },
      {
        path: "r/:id",
        loader: async ({ request }) => {
          const url = new URL(request.url);
          const articleUrl = url.searchParams.get("url");
          return articleUrl ? redirect(articleUrl) : redirect("/feed");
        },
      },
    ],
  },
  {
    path: "*",
    Component: PageError,
  },
];

function routeTransformer({
  fallback: FallbackComponent,
  ...route
}: AppRoute): RouteObject {
  let result = { ...route };
  if (FallbackComponent) {
    result = {
      ...result,
      Component: (props) => (
        <Suspense fallback={<FallbackComponent />}>
          <route.Component {...props} />
        </Suspense>
      ),
    };
  }

  return {
    ...result,
    children: route.children?.map(routeTransformer),
  } as RouteObject;
}

export const router = createBrowserRouter(routes.map(routeTransformer));

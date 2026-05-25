import { createBrowserRouter, redirect } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { FeedPage } from "@/pages/FeedPage";
import { ClustersPanel } from "@/components/ClustersPanel";
import { ClusterSection } from "@/pages/ClusterSection";
import { feedLoader, clustersLoader, clusterLoader } from "@/loaders";
import { db } from "@/lib/db";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, loader: () => redirect("/feed") },
      { path: "feed", element: <FeedPage />, loader: feedLoader },
      { path: "clusters", element: <ClustersPanel />, loader: clustersLoader },
      {
        path: "clusters/:id",
        element: <ClusterSection />,
        loader: clusterLoader,
      },
      {
        path: "r/:id",
        loader: async ({ params, request }) => {
          const { id } = params;
          const url = new URL(request.url);
          const articleUrl = url.searchParams.get("url");
          if (!articleUrl) return redirect("/feed");

          db.clicks
            .add({
              articleId: id,
              title: url.searchParams.get("title") ?? "",
              url: articleUrl,
              source: url.searchParams.get("source") ?? undefined,
              sourceBaseUrl: url.searchParams.get("sourceBaseUrl") ?? undefined,
              clickedAt: new Date().toISOString(),
            })
            .catch(() => {});

          return redirect(articleUrl);
        },
      },
    ],
  },
]);

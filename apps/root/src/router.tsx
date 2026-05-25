import { createBrowserRouter, redirect } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { FeedPage } from "@/pages/FeedPage";
import { ClustersPanel } from "@/components/ClustersPanel";
import { ClusterSection } from "@/pages/ClusterSection";
import { feedLoader, clustersLoader, clusterLoader } from "@/loaders";

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
    ],
  },
]);

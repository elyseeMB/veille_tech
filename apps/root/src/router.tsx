import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { FeedPage } from "@/pages/FeedPage";
import { feedLoader, clusterLoader } from "@/loaders";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <FeedPage />,
        loader: feedLoader,
      },
      {
        path: "feed",
        element: <FeedPage />,
        loader: feedLoader,
      },
      {
        path: "cluster/:id",
        element: <FeedPage />,
        loader: clusterLoader,
      },
    ],
  },
]);

import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { db } from "@/lib/db";

export function RedirectArticle() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const url = searchParams.get("url");
    if (!url) return;

    db.clicks
      .add({
        articleId: id,
        title: searchParams.get("title") ?? "",
        url,
        source: searchParams.get("source") ?? undefined,
        sourceBaseUrl: searchParams.get("sourceBaseUrl") ?? undefined,
        clickedAt: new Date().toISOString(),
      })
      .catch(() => {});

    window.location.replace(url);
  }, [id, searchParams]);

  return null;
}

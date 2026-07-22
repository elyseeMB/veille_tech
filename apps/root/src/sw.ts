// @ts-nocheck
import { db } from "@/lib/db";

declare let self: ServiceWorkerGlobalScope;

self.addEventListener("activate", (event) => {
	event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);
	if (!url.pathname.startsWith("/r/")) return;

	const articleUrl = url.searchParams.get("url");
	if (!articleUrl) return;

	const articleId = url.pathname.split("/r/")[1];

	event.waitUntil(
		db.clicks
			.add({
				articleId,
				title: url.searchParams.get("title") || "",
				url: articleUrl,
				source: url.searchParams.get("source") || undefined,
				sourceBaseUrl: url.searchParams.get("sourceBaseUrl") || undefined,
				clickedAt: new Date().toISOString(),
			})
			.catch((err) => console.error("SW history error:", err)),
	);

	event.respondWith(Response.redirect(articleUrl));
});

// oxlint-disable-next-line
self.__WB_MANIFEST;

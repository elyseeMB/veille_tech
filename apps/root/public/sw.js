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
    saveToHistory({
      articleId,
      title: url.searchParams.get("title"),
      url: articleUrl,
      source: url.searchParams.get("source"),
      sourceBaseUrl: url.searchParams.get("sourceBaseUrl"),
    }).catch((err) => console.error("SW history error:", err)),
  );

  event.respondWith(Response.redirect(articleUrl));
});

async function saveToHistory(entry) {
  const db = await openDB();
  const tx = db.transaction("clicks", "readwrite");
  tx.objectStore("clicks").add({
    ...entry,
    clickedAt: new Date().toISOString(),
  });
  return tx.complete;
}

async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("veille-history");
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("clicks")) {
        db.createObjectStore("clicks", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = reject;
  });
}

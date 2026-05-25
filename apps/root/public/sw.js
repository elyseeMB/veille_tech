self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith("/r/")) return;

  const articleId = url.pathname.split("/r/")[1];
  const title = url.searchParams.get("title");
  const articleUrl = url.searchParams.get("url");
  const source = url.searchParams.get("source");
  const sourceBaseUrl = url.searchParams.get("sourceBaseUrl");

  const fetchPromise = fetch(event.request.clone());

  event.waitUntil(
    fetchPromise
      .then(async () => {
        await saveToHistory({
          articleId,
          title,
          url: articleUrl,
          source,
          sourceBaseUrl,
        });
      })
      .catch((err) => console.error("SW history error:", err)),
  );

  event.respondWith(fetchPromise);
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

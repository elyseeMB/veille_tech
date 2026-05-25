self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

const API_BASE =
  self.location.hostname === "localhost"
    ? "http://localhost:8081"
    : "https://api.veille.safecoffi.app";

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith("/r/")) return;

  const articleId = url.pathname.split("/r/")[1];
  const apiUrl = `${API_BASE}/r/${articleId}${url.search}`;

  event.respondWith(
    fetch(apiUrl, { redirect: "manual" })
      .then((res) => {
        const location = res.headers.get("Location");
        if (location) {
          event.waitUntil(
            saveToHistory({
              articleId,
              title: url.searchParams.get("title"),
              url: url.searchParams.get("url"),
              source: url.searchParams.get("source"),
              sourceBaseUrl: url.searchParams.get("sourceBaseUrl"),
            }).catch((err) => console.error("SW history error:", err)),
          );
          return Response.redirect(location);
        }
        return res;
      })
      .catch(() => fetch(event.request)),
  );
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

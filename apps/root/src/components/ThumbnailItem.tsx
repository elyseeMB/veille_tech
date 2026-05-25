const API_URL = import.meta.env.DEV
  ? "http://localhost:8081"
  : import.meta.env.VITE_API_URL;

export function ThumbnailItem({
  source,
  sourceBaseUrl,
}: {
  source: string;
  sourceBaseUrl?: string;
}) {
  const domain = sourceBaseUrl ?? "";

  return (
    <div className="inline-flex items-center gap-1.5">
      <img
        src={`${API_URL}/v1/favicon?domain=${domain}`}
        alt={source}
        title={source}
        className="w-5 h-5 rounded-full border-2 border-background object-contain bg-muted"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      <span className="font-medium text-muted-foreground">{source}</span>
    </div>
  );
}

interface Source {
  name: string;
  baseUrl: string;
}

interface SourcesBadgeProps {
  sources: Source[];
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";

export function SourcesBadge({ sources }: SourcesBadgeProps) {
  const shown = sources.slice(0, 4);
  const count = sources.length;

  return (
    <div className="inline-flex items-center gap-2">
      <div className="flex items-center">
        {shown.map((source, i) => (
          <img
            key={source.name}
            src={`${API_URL}/v1/favicon?domain=${source.baseUrl}`}
            alt={source.name}
            title={source.name}
            className="w-5 h-5 rounded-full border-2 border-background object-contain bg-muted"
            style={{ marginLeft: i === 0 ? 0 : -6 }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        {count} source{count > 1 ? "s" : ""}
      </span>
    </div>
  );
}

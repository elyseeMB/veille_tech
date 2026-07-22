interface Source {
	name: string;
	baseUrl: string;
}

interface SourcesBadgeProps {
	sources: Source[];
}

const API_URL = import.meta.env.DEV ? "http://localhost:8081" : import.meta.env.VITE_API_URL;

export function SourcesBadge({ sources }: SourcesBadgeProps) {
	const shown = sources.slice(0, 8);
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
						className="border-background bg-muted h-6 w-6 rounded-full border-2 object-contain"
						style={{ marginLeft: i === 0 ? 0 : -7 }}
						onError={(e) => {
							(e.currentTarget as HTMLImageElement).style.display = "none";
						}}
					/>
				))}
			</div>
			<span className="text-muted-foreground text-sm font-medium whitespace-nowrap">
				{count} source{count > 1 ? "s" : ""}
			</span>
		</div>
	);
}

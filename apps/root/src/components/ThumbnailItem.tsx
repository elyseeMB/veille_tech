const API_URL = import.meta.env.DEV ? "http://localhost:8081" : import.meta.env.VITE_API_URL;

export function ThumbnailItem({ source, sourceBaseUrl }: { source: string; sourceBaseUrl?: string }) {
	const domain = sourceBaseUrl ?? "";

	return (
		<div className="inline-flex items-center gap-1.5">
			<img
				src={`${API_URL}/v1/favicon?domain=${domain}`}
				alt={source}
				title={source}
				className="border-background bg-muted h-5 w-5 rounded-full border-2 object-contain"
				onError={(e) => {
					(e.currentTarget as HTMLImageElement).style.display = "none";
				}}
			/>
			<span className="text-muted-foreground max-w-[150px] truncate font-medium">{domain}</span>
		</div>
	);
}

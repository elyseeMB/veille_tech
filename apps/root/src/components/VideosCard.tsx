import { TimeRelative } from "./TimeRelative.tsx";
import { Skeleton } from "./ui/skeleton.tsx";

// --- Types ---
export type YoutubeVideo = {
	id: string;
	title: string;
	description: string;
	channelTitle: string;
	thumbnail: string;
	publishedAt: string;
	channelAvatar?: string;
};

// --- Mock data ---
export const MOCK_VIDEOS: YoutubeVideo[] = [
	{
		id: "dQw4w9WgXcQ",
		title: "Making-of — FAKER 🐐",
		description:
			"Collaboration commerciale @AdobeFrance. Montage sous After Effects, motion design par @yionidas. Retour sur la création de ce projet ambitieux.",
		channelTitle: "Micode",
		thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
		publishedAt: "2026-04-15T14:00:00Z",
		channelAvatar: "https://i.pravatar.cc/150?img=1",
	},
	{
		id: "9bZkp7q19f0",
		title: "1089 pixels pour comprendre que vous n'existez pas.",
		description:
			"Hop un pixel. Hop un deuxième. Hop un mille quatre-vingt-neuvième. Une vidéo sur la simulation, la conscience et les limites de la perception humaine.",
		channelTitle: "Micode",
		thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
		publishedAt: "2026-04-10T10:30:00Z",
		channelAvatar: "https://i.pravatar.cc/150?img=1",
	},
	{
		id: "L_jWHffIx5E",
		title: "Le Jeu de la Vie 2.0",
		description:
			"Cellule cellule cellule. Le jeu de la vie de Conway revisité avec des règles modifiées. Émergence, complexité et auto-organisation expliquées simplement.",
		channelTitle: "Micode",
		thumbnail: "https://i.ytimg.com/vi/L_jWHffIx5E/hqdefault.jpg",
		publishedAt: "2026-04-01T09:00:00Z",
		channelAvatar: "https://i.pravatar.cc/150?img=1",
	},
];

function VideoItem({ item }: { item: YoutubeVideo }) {
	const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

	return (
		<article className="group border-border hover:bg-foreground/5 relative -mx-[1rem] w-[calc(100%_+_2rem)] border-t p-4 transition-colors lg:mx-0 lg:w-full lg:py-5 lg:pr-5 lg:pl-0">
			<a
				href={`https://www.youtube.com/watch?v=${item.id}`}
				target="_blank"
				rel="noreferrer"
				className="z-10 before:absolute before:inset-0 before:h-full before:w-full before:content-['']"
			/>

			<div className="grid grid-cols-[1px_1fr] gap-5">
				{/* ── Barre gauche 1px ── */}
				<div className="bg-muted group-hover:bg-foreground opacity-0 transition-colors group-hover:opacity-100" />

				{/* ── Contenu ── */}
				<div className="flex min-w-0 flex-1 flex-col gap-3 pb-1">
					{/* Timestamp relatif */}
					<TimeRelative date={item.publishedAt} />

					{/* Channel header */}
					<div className="text-muted-foreground flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase">
						<div className="flex items-center gap-2 font-sans">
							{item.channelAvatar && (
								<img
									className="inline-block w-10 rounded-full object-cover"
									src={`${API_URL}${item.channelAvatar}`}
									alt=""
								/>
							)}
							<span className="text-foreground text-sm">{item.channelTitle}</span>
						</div>
						<span className="bg-foreground/10 h-px flex-1" />
						<time>
							{new Date(item.publishedAt).toLocaleDateString("en", {
								year: "numeric",
								day: "numeric",
								month: "short",
							})}
						</time>
					</div>

					{/* Titre */}
					<h2 className="text-foreground group-hover:text-muted-foreground text-lg leading-snug font-medium tracking-[-0.01em] transition-colors">
						{item.title}
					</h2>

					{/* Thumbnail */}
					{item.thumbnail && (
						<div className="border-border aspect-video w-full overflow-hidden rounded border">
							<img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
						</div>
					)}

					{/* Description */}
					{item.description && (
						<p className="text-muted-foreground pl-1 text-sm leading-relaxed">{item.description.slice(0, 120)}…</p>
					)}
				</div>
			</div>
		</article>
	);
}

export function VideosCard({ data, loading }: { data?: { videos?: YoutubeVideo[] }; loading: boolean }) {
	const videos = import.meta.env.APP_ENV === "dev" && !data?.videos ? MOCK_VIDEOS : (data?.videos ?? []);

	return (
		<div className="space-y-0">
			{loading ? (
				Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="border-border mb-9 grid grid-cols-[1px_1fr] gap-5 border-b py-5 pr-5">
						<Skeleton className="bg-muted h-full" />
						<div className="space-y-3">
							<Skeleton className="bg-muted h-3 w-20" />
							<Skeleton className="bg-muted h-5 w-4/5" />
							<Skeleton className="bg-muted h-40 w-full" />
						</div>
					</div>
				))
			) : videos.length === 0 ? (
				<p className="text-muted-foreground py-5 text-sm">No videos yet.</p>
			) : (
				videos.map((item, i) => <VideoItem key={item.id || i} item={item} />)
			)}
		</div>
	);
}

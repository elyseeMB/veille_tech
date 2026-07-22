import { ChevronRight } from "lucide-react";
import { useState } from "react";

const SOURCES = [
	{
		name: "Hacker News",
		count: 18,
		active: true,
		feeds: [
			{
				name: "Front page",
				url: "https://news.ycombinator.com/rss",
				count: 10,
			},
			{ name: "Show HN", url: "https://hnrss.org/show", count: 5 },
			{ name: "Ask HN", url: "https://hnrss.org/ask", count: 3 },
		],
	},
	{
		name: "The Verge",
		count: 9,
		active: true,
		feeds: [
			{ name: "Tout", url: "https://www.theverge.com/rss/index.xml", count: 5 },
			{
				name: "Tech",
				url: "https://www.theverge.com/rss/tech/index.xml",
				count: 2,
			},
			{
				name: "Science",
				url: "https://www.theverge.com/rss/science/index.xml",
				count: 2,
			},
		],
	},
	{
		name: "Ars Technica",
		count: 11,
		active: true,
		feeds: [
			{
				name: "Tout",
				url: "https://feeds.arstechnica.com/arstechnica/index",
				count: 6,
			},
			{
				name: "Sécurité",
				url: "https://arstechnica.com/security/feed",
				count: 3,
			},
			{ name: "IA", url: "https://arstechnica.com/ai/feed", count: 2 },
		],
	},
	{
		name: "MIT Tech Review",
		count: 5,
		active: false,
		feeds: [
			{ name: "Tout", url: "https://www.technologyreview.com/feed", count: 3 },
			{
				name: "IA",
				url: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
				count: 2,
			},
		],
	},
	{
		name: "Wired",
		count: 4,
		active: false,
		feeds: [
			{ name: "Tout", url: "https://www.wired.com/feed/rss", count: 2 },
			{
				name: "Sécurité",
				url: "https://www.wired.com/feed/category/security/latest/rss",
				count: 2,
			},
		],
	},
];

export function SourcesPanel() {
	const [expanded, setExpanded] = useState<string[]>([]);

	const toggle = (name: string) =>
		setExpanded((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

	return (
		<section id="sources">
			<div className="flex items-center justify-between px-5 pt-6 pb-2">
				<p className="text-muted-foreground font-mono text-[10px] tracking-[0.25em] uppercase">Sources</p>
				<span className="text-foreground font-mono text-[10px]">{SOURCES.length}</span>
			</div>

			<div className="grid grid-cols-1">
				{SOURCES.map((source) => {
					const isOpen = expanded.includes(source.name);
					return (
						<div key={source.name} className="border-border border-b last:border-0">
							<div
								onClick={() => toggle(source.name)}
								className="group hover:bg-foreground/5 flex cursor-pointer items-center justify-between px-5 py-3 transition-colors"
							>
								<div className="flex items-center gap-2">
									<span
										className={`text-muted-foreground/50 transition-transform duration-200 select-none ${isOpen ? "rotate-90" : ""} inline-block`}
									>
										<ChevronRight size={16} />
									</span>
									<span
										className={`flex items-center gap-2 text-sm before:block before:h-1.5 before:w-1.5 before:rounded-full before:content-[''] ${
											source.active
												? "text-foreground before:bg-foreground"
												: "text-muted-foreground before:bg-muted-foreground/30"
										}`}
									>
										{source.name}
									</span>
								</div>
								<div className="-mr-1.5 flex items-center gap-2">
									<span className="text-foreground font-mono text-[10px]">{source.count}</span>
									<div className="bg-primary text-primary-foreground flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-bold">
										+2
									</div>
								</div>
							</div>

							{isOpen && (
								<div className="border-border/50 border-t">
									{source.feeds.map((feed, i) => (
										<div
											key={i}
											className="hover:bg-foreground/5 group flex cursor-default items-center justify-between py-2 pr-5 pl-10 transition-colors"
										>
											<div className="relative flex items-center gap-2">
												<span className="bg-border absolute top-1/2 -left-4 h-px w-3 -translate-y-1/2" />
												<span className="text-muted-foreground group-hover:text-foreground max-w-[120px] truncate font-mono text-[10px] transition-colors">
													{feed.name}
												</span>
											</div>
											<div className="-mr-1.5 flex items-center gap-2">
												<span className="text-foreground font-mono text-[10px]">{feed.count}</span>
												<div className="bg-primary text-primary-foreground flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-bold">
													+2
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</section>
	);
}

import { Pin } from "lucide-react";

const PINNED = [
	{
		index: "01",
		title: "CVE-2009-0238 — Faille Excel 17 ans, activement exploitée",
		source: "CISA",
		date: "14 avr.",
		href: "#",
	},
	{
		index: "02",
		title: "Meta licencie 5% de ses effectifs, focus sur l'IA générative",
		source: "The Verge",
		date: "12 avr.",
		href: "#",
	},
	{
		index: "03",
		title: "Llama 4 : architecture MoE, 10M tokens de contexte",
		source: "Hacker News",
		date: "11 avr.",
		href: "#",
	},
	{
		index: "04",
		title: "Llama 4 : architecture MoE, 10M tokens de contexte",
		source: "Hacker News",
		date: "11 avr.",
		href: "#",
	},
	{
		index: "05",
		title: "Llama 4 : architecture MoE, 10M tokens de contexte",
		source: "Hacker News",
		date: "11 avr.",
		href: "#",
	},
	{
		index: "06",
		title: "Llama 4 : architecture MoE, 10M tokens de contexte",
		source: "Hacker News",
		date: "11 avr.",
		href: "#",
	},
	{
		index: "07",
		title: "Llama 4 : architecture MoE, 10M tokens de contexte",
		source: "Hacker News",
		date: "11 avr.",
		href: "#",
	},
];

export function PinnedArticles() {
	return (
		<section>
			<div className="bg-border h-px w-full" />

			<div className="flex items-center justify-between px-5 pt-6 pb-2">
				<p className="text-muted-foreground font-mono text-[10px] tracking-[0.25em] uppercase">Épinglés</p>
				<span className="text-foreground font-mono text-[10px]">{PINNED.length}</span>
			</div>

			<div className="flex flex-col">
				{PINNED.map((article) => (
					<a
						key={article.index}
						href={article.href}
						className="group border-border hover:bg-foreground/5 relative flex gap-4 border-b px-5 py-4 transition-colors last:border-0"
					>
						<span className="text-muted-foreground group-hover:text-muted-foreground/60 pt-0.5 font-mono text-[11px] tabular-nums transition-colors select-none">
							{article.index}
						</span>
						<div className="flex min-w-0 flex-1 flex-col gap-2">
							<div className="flex items-start justify-start gap-1">
								<p className="text-foreground group-hover:text-muted-foreground text-sm leading-snug transition-colors">
									{article.title}
								</p>
								<Pin size={16} />
							</div>
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground font-mono text-[10px] tracking-[0.15em] uppercase">
									{article.source}
								</span>
								<span className="bg-border h-2.5 w-px" />
								<span className="text-muted-foreground font-mono text-[10px]">{article.date}</span>
							</div>
						</div>
						<span className="bg-foreground absolute top-3 bottom-3 left-0 w-px opacity-0 transition-opacity group-hover:opacity-100" />
					</a>
				))}
			</div>
		</section>
	);
}

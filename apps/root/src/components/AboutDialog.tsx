import { Info, InfoIcon } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { DialogContent, DialogFooter, DialogHeader, DialogTrigger, DialogClose, DialogTitle } from "./ui/dialog.tsx";

export default function AboutDialog() {
	return (
		<>
			<DialogTrigger
				render={
					<Button variant="ghost" className="text-muted-foreground/60 hover:text-foreground cursor-pointer">
						<Info />
					</Button>
				}
			/>
			<DialogContent>
				<div className="flex items-center gap-2">
					<div className="bg-muted rounded-md p-2">
						<InfoIcon size={16} />
					</div>
					<DialogHeader>
						<DialogTitle tabIndex={1}>About this project</DialogTitle>
					</DialogHeader>
				</div>
				<div className="no-scrollbar scrollbar-hide -mx-4 max-h-[50vh] overflow-y-auto px-4 text-base">
					<p className="text-muted-foreground mb-6 leading-normal">
						This project started from a simple desire: to stay informed differently. Honest critiques, human and
						authentic perspectives on tech.
					</p>

					<h3 tabIndex={2} className="mb-2 font-semibold">
						How it works
					</h3>
					<p className="text-muted-foreground mb-4 leading-normal">The pipeline runs in two stages.</p>
					<p className="text-muted-foreground mb-4 leading-normal">
						A fetcher collects public RSS feeds every 30 minutes. Each new article is vectorized — only its mathematical
						representation is stored, never the raw text.
					</p>
					<p className="text-muted-foreground mb-6 leading-normal">
						Twice a day, vectors are automatically grouped by topic and labeled by a language model. The result: a clean
						feed, grouped by theme, twice a day.
					</p>

					<h3 tabIndex={3} className="mb-2 font-semibold">
						Caveats
					</h3>
					<p className="text-muted-foreground mb-4 leading-normal">
						Clustering works best with enough article volume. Labels are generated automatically, they can sometimes be
						too broad. Treat them as a starting point, not ground truth.
					</p>

					<h3 tabIndex={4} className="mb-2 font-semibold">
						Who made this
					</h3>
					<p className="mb-4 leading-normal">
						I'm Elysée, a software engineer. You can find my other projects at{" "}
						<a
							href="https://eembouz.com/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground underline underline-offset-4"
							tabIndex={4}
						>
							eembouz.com
						</a>
					</p>
				</div>
				<DialogFooter>
					<DialogClose render={<Button variant="outline">Close</Button>} />
				</DialogFooter>
			</DialogContent>
		</>
	);
}

import { Info, InfoIcon } from "lucide-react";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  DialogClose,
  DialogTitle,
} from "./ui/dialog.tsx";
import { Button } from "./ui/button.tsx";

export default function AboutDialog() {
  return (
    <>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            className="cursor-pointer text-muted-foreground/60 hover:text-foreground"
          >
            <Info />
          </Button>
        }
      />
      <DialogContent>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-md bg-muted">
            <InfoIcon size={16} />
          </div>
          <DialogHeader>
            <DialogTitle tabIndex={1}>About this project</DialogTitle>
          </DialogHeader>
        </div>
        <div className="-mx-4 text-base no-scrollbar scrollbar-hide max-h-[50vh] overflow-y-auto px-4">
          <p className="mb-6 leading-normal text-muted-foreground">
            This project started from a simple desire: to stay informed
            differently. Honest critiques, human and authentic perspectives on
            tech.
          </p>

          <h3 tabIndex={2} className="mb-2 font-semibold">
            How it works
          </h3>
          <p className="mb-4 leading-normal text-muted-foreground">
            The pipeline runs in two stages.
          </p>
          <p className="mb-4 leading-normal text-muted-foreground">
            A fetcher collects public RSS feeds every 30 minutes. Each new
            article is vectorized — only its mathematical representation is
            stored, never the raw text.
          </p>
          <p className="mb-6 leading-normal text-muted-foreground">
            Twice a day, vectors are automatically grouped by topic and labeled
            by a language model. The result: a clean feed, grouped by theme,
            twice a day.
          </p>

          <h3 tabIndex={3} className="mb-2 font-semibold">
            Caveats
          </h3>
          <p className="mb-4 leading-normal text-muted-foreground">
            Clustering works best with enough article volume. Labels are
            generated automatically, they can sometimes be too broad. Treat them
            as a starting point, not ground truth.
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
              className="underline underline-offset-4 text-foreground"
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

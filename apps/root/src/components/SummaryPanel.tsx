import { useRef } from "react";
import { ArrowUpRight, ChevronsUpDown } from "lucide-react";
import { Button } from "./ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.tsx";
import {
  useSummaryStore,
  MODEL_LABELS,
  type AIModel,
} from "@/store/summaryStore.ts";

import { marked } from "marked";

export function SummaryPanel() {
  const sectionRef = useRef<HTMLElement>(null);
  const { selectedArticle, activeModel, setActiveModel } = useSummaryStore();

  console.log(selectedArticle);

  return (
    <section
      ref={sectionRef}
      id="summary"
      className="sticky overflow-y-auto scrollbar-hide overscroll-contain top-[var(--header-height)] h-[calc(100vh_-_var(--header-height))] border-r border-border col-span-2"
    >
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="text-sm -ml-3 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                Summary · {MODEL_LABELS[activeModel]}
                <ChevronsUpDown size={16} />
              </Button>
            }
          />
          <DropdownMenuContent
            className="font-serif text-sm leading-relaxed"
            align="end"
          >
            {(Object.entries(MODEL_LABELS) as [AIModel, string][]).map(
              ([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setActiveModel(key)}
                  className="gap-2 flex items-center justify-between"
                >
                  <span>Summary with {label}</span>
                  {key !== "cloudflare" && (
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 ml-3">
                      soon
                    </span>
                  )}
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <a href={selectedArticle?.url ?? "#"} target="_blank" rel="noreferrer">
          <Button
            variant="ghost"
            className="flex items-center gap-1 cursor-pointer text-muted-foreground"
          >
            original
            <ArrowUpRight size={16} />
          </Button>
        </a>
      </div>

      {/* Contenu */}
      {!selectedArticle ? (
        <div className="px-5 py-8">
          <p className="text-sm text-muted-foreground">
            Select an article to see the summary.
          </p>
        </div>
      ) : selectedArticle.content ? (
        <div
          onClick={() =>
            sectionRef.current?.scrollTo({ top: 0, behavior: "smooth" })
          }
          className="px-5 py-2 flex flex-col gap-5"
        >
          <p className="border-b border-border pb-3 text-lg tracking-tight">
            {selectedArticle.title}
          </p>
          <div
            style={{ width: 600 }}
            className="prose m-auto dark:prose-invert prose-headings:font-sans prose-headings:text-lg text-primary "
            dangerouslySetInnerHTML={{
              __html: marked.parse(selectedArticle?.content ?? ""),
            }}
          />
          {/* {selectedArticle.content} */}
        </div>
      ) : (
        <div className="px-5 py-8">
          <p className="text-sm text-muted-foreground">
            No summary available yet.
          </p>
        </div>
      )}
    </section>
  );
}

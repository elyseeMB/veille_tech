import { useRef } from "react";
import { ArrowUpRight, ChevronsUpDown } from "lucide-react";
import { Button } from "./ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.tsx";

const MODELS = ["gemini 2.5", "claude opus", "gpt 4.5"];

export function SummaryPanel() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      id="summary"
      className="sticky overflow-y-auto pt-2 scrollbar-hide overscroll-contain top-[var(--header-height)] h-[calc(100vh_-_var(--header-height))]"
    >
      <div className="border-r border-border">
        <div className="px-5 py-2 flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="text-sm -ml-3 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  Summary generated with gemini 2.5
                  <ChevronsUpDown size={16} />
                </Button>
              }
            />
            <DropdownMenuContent
              className="font-serif text-sm leading-relaxed"
              align="end"
            >
              {MODELS.map((model) => (
                <DropdownMenuItem
                  key={model}
                  onClick={() => console.log(model)}
                  className="gap-2"
                >
                  Summary generated with {model}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <a href="#">
            <Button
              variant="ghost"
              className="flex items-center gap-1 cursor-pointer text-muted-foreground"
            >
              original
              <ArrowUpRight size={16} />
            </Button>
          </a>
        </div>

        <div
          onClick={() =>
            sectionRef.current?.scrollTo({ top: 0, behavior: "smooth" })
          }
          className="px-5 py-2 flex flex-col gap-5"
        >
          <p className="leading-relaxed">
            La Cybersecurity and Infrastructure Security Agency (CISA) a ajouté
            la CVE-2009-0238 à sa liste Known Exploited Vulnerabilities (KEV) le
            14 avril 2026.
          </p>
          <p className="leading-relaxed">
            Cette vulnérabilité critique dans Microsoft Excel, vieille de 17
            ans, possède un score CVSS v2 de 8.8/10 et permet une exécution de
            code à distance (RCE).
          </p>
          <p className="leading-relaxed">
            Les attaques se propagent principalement par phishing, utilisant des
            macros ou objets embarqués pour injecter du code arbitraire.
          </p>
          <p className="leading-relaxed">
            Découverte en 2009 et patchée par Microsoft (MS09-017), elle
            persiste dans les environnements legacy non mis à jour.
          </p>
          <p className="leading-relaxed">
            CISA impose une deadline stricte aux agences fédérales US :
            appliquer les correctifs d'ici le 28 avril 2026.
          </p>
          <p className="leading-relaxed">
            <strong>Mitigations prioritaires</strong> — Patcher immédiatement
            tous les déploiements Office (y compris Extended Support).
          </p>
        </div>
      </div>
    </section>
  );
}

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  type PropsWithChildren,
} from "react";
import { Button } from "./ui/button.tsx";
import { ArrowDown, X } from "lucide-react";
import { useSummaryStore } from "@/store/summaryStore.ts";

type BannerData = {
  title: string;
  source: string;
  pubDate: string;
  node: HTMLElement | null;
} | null;

const defaultSet = (_: BannerData) => {};
const BannerContext = createContext({ setBannerRef: { current: defaultSet } });

export function BannerProvider({ children }: PropsWithChildren) {
  const setBannerRef = useRef(defaultSet);
  return (
    <BannerContext.Provider value={{ setBannerRef }}>
      <Banner />
      {children}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  const { setBannerRef } = useContext(BannerContext);
  return {
    pushBanner: useCallback(
      (data: BannerData) => setBannerRef.current(data),
      [setBannerRef],
    ),
  };
}

export function Banner() {
  const [banner, setBanner] = useState<BannerData>(null);
  const { setBannerRef } = useContext(BannerContext);
  const { setSelectedArticle } = useSummaryStore();
  setBannerRef.current = ({ ...props }) => {
    setBanner(props);
  };

  if (!banner) {
    return null;
  }

  return (
    <div
      className="hidden lg:flex sticky z-40 items-center gap-3 pl-0 px-5 py-2 bg-primary-foreground border-x border-b border-border animate-banner"
      style={{ top: "calc(var(--header-height))" }}
    >
      <div className="w-0.5 h-6 rounded-full bg-foreground shrink-0" />
      <div className="min-w-0 flex-1 pl-1">
        <p className="text-xs text-muted-foreground truncate">
          {banner.source} ·{" "}
          {new Date(banner.pubDate).toLocaleDateString("en", {
            day: "numeric",
            month: "short",
          })}
        </p>
        <p className="text-sm font-medium truncate text-foreground">
          {banner.title}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          className="text-xs flex gap-1 items-center text-muted-foreground cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            banner.node?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }}
        >
          <ArrowDown size="12" />
          Voir
        </Button>
        <Button
          variant="ghost"
          className="text-xs flex gap-1 items-center text-muted-foreground cursor-pointer"
          onClick={() => {
            setBanner(null);
            setSelectedArticle(null);
          }}
        >
          <X size="12" />
        </Button>
      </div>
    </div>
  );
}

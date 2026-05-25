import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  type PropsWithChildren,
  useLayoutEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button.tsx";
import { ArrowRight, Target, X } from "lucide-react";
import { useSummaryStore } from "@/store/summaryStore.ts";

type BannerData = {
  title: string;
  source: string;
  pubDate: string;
  node: HTMLElement | null;
  clusterLabel?: string;
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
  const navigate = useNavigate();
  const bannerRef = useRef<HTMLDivElement>(null);
  setBannerRef.current = (props) => {
    setBanner(props);
  };

  useLayoutEffect(() => {
    const el = bannerRef.current;
    if (!el) return;

    const measure = () => {
      document.documentElement.style.setProperty(
        "--banner-height",
        `${el.getBoundingClientRect().height}px`,
      );
    };

    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(el);

    return () => {
      obs.disconnect();
      document.documentElement.style.setProperty("--banner-height", "0px");
    };
  }, [banner]);

  if (!banner) return null;

  return (
    <div
      ref={bannerRef}
      className="hidden lg:flex sticky z-40 items-center gap-3 pl-0 px-5 py-2 bg-primary-foreground border-x border-b border-border animate-banner"
      style={{ top: "calc(var(--header-height))" }}
    >
      <div className="w-0.5 h-6 rounded-full bg-foreground shrink-0" />

      {banner.clusterLabel ? (
        <div className="min-w-0 flex-1 pl-1 flex flex-col gap-0.5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground truncate">
            {banner.clusterLabel}
          </p>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground shrink-0">
              {banner.source} ·
              {new Date(banner.pubDate).toLocaleDateString("en", {
                day: "numeric",
                month: "short",
              })}
            </p>
            <ArrowRight
              size={12}
              className="shrink-0 text-muted-foreground/50"
            />
            <AnimatePresence mode="popLayout">
              <motion.p
                key={banner.title}
                className="text-sm font-medium truncate text-foreground"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {banner.title}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="min-w-0 flex-1 pl-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground truncate">
              {banner.source}
            </span>
            <span>·</span>
            <span className="text-muted-foreground truncate">
              {new Date(banner.pubDate).toLocaleDateString("en", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          <span className="font-medium truncate text-foreground">
            {banner.title}
          </span>
        </div>
      )}

      <div className="flex items-center">
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
          <Target />
          Target
        </Button>
        <Button
          variant="ghost"
          className="text-xs flex gap-1 items-center text-muted-foreground cursor-pointer"
          onClick={() => {
            setBanner(null);
            setSelectedArticle(null);
            navigate("/feed");
          }}
        >
          <X size="12" />
          Close
        </Button>
      </div>
    </div>
  );
}

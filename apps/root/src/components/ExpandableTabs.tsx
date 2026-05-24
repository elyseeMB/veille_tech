import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookIcon, HeartIcon, GiftIcon } from "lucide-react";

const tabs = [
  {
    name: "Explore",
    value: "explore",
    icon: <BookIcon className="size-4 shrink-0" />,
    content: (
      <>
        Discover{" "}
        <span className="text-foreground font-semibold">fresh ideas</span>,
        trending topics, and hidden gems curated just for you. Start exploring
        and let your curiosity lead the way!
      </>
    ),
  },
  {
    name: "Favorites",
    value: "favorites",
    icon: <HeartIcon className="size-4 shrink-0" />,
    content: (
      <>
        All your{" "}
        <span className="text-foreground font-semibold">favorites</span> are
        saved here. Revisit articles, collections, and moments you love, any
        time you want a little inspiration.
      </>
    ),
  },
  {
    name: "Surprise Me",
    value: "surprise",
    icon: <GiftIcon className="size-4 shrink-0" />,
    content: (
      <>
        <span className="text-foreground font-semibold">Surprise!</span>{" "}
        Here&apos;s something unexpected — a fun fact, a quirky tip, or a daily
        challenge. Come back for a new surprise every day!
      </>
    ),
  },
];

const INACTIVE_W = 50;
const GAP = 16;
const PADDING = 0;

export default function ExpandableTabs() {
  const [activeTab, setActiveTab] = useState("explore");
  const [activeWidth, setActiveWidth] = useState(120);
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!listRef.current) {
      return;
    }
    const node = listRef.current;
    const rect = node.getBoundingClientRect();

    const calculate = () => {
      document.documentElement.style.setProperty(
        "--tabs-height",
        `${rect.height}px`,
      );

      const total = rect.width - PADDING;
      const inactiveTotal =
        (tabs.length - 1) * INACTIVE_W + (tabs.length - 1) * GAP;
      setActiveWidth(total - inactiveTotal - GAP);
    };

    calculate();

    const obs = new ResizeObserver(calculate);
    obs.observe(node);
    return () => {
      obs.disconnect();
      document.documentElement.style.setProperty("--tabs-height", "0px");
    };
  }, []);

  return (
    <div className="w-full max-w-md bg-emerald-700">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
        <TabsList
          ref={listRef}
          className="
          rounded-none
          flex
          justify-between
          px-4
          w-full
          h-auto
          fixed
          bg-background
          top-[var(--header-height)]
          left-0
          z-50
          before:absolute
          before:inset-x-0
          before:top-full
          before:h-8
          before:content-['']
          before:pointer-events-none
          before:bg-gradient-to-b
          before:from-background
          before:to-transparent
          "
        >
          {tabs.map(({ icon, name, value }) => {
            const isActive = activeTab === value;

            return (
              <motion.div
                key={value}
                className="overflow-hidden shrink-0"
                initial={false}
                animate={{ width: isActive ? activeWidth : INACTIVE_W }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <TabsTrigger
                  value={value}
                  className="flex h-12 w-full items-center justify-center gap-1.5 px-2 data-[state=active]:shadow-none border border-input"
                >
                  {icon}
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.span
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        {name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </TabsTrigger>
              </motion.div>
            );
          })}
        </TabsList>

        {/* {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className="text-muted-foreground text-sm">{tab.content}</p>
          </TabsContent>
        ))} */}
      </Tabs>
    </div>
  );
}

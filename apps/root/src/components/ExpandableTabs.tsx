import {
  useState,
  useRef,
  useLayoutEffect,
  type ReactNode,
  type JSX,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabsListNode = Array<{
  name: string;
  value: string;
  icon: JSX.Element;
}>;

const INACTIVE_W = 50;
const GAP = 16;
const PADDING = 0;

export default function ExpandableTabs({
  tabs,
  children,
}: {
  tabs: TabsListNode;
  children?: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState("feed");
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
  }, [tabs.length]);

  return (
    <div className="w-full max-w-md">
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
          before:h-6
          before:content-['']
          before:pointer-events-none
          before:bg-gradient-to-b
          before:from-30%
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
        {children}
      </Tabs>
    </div>
  );
}

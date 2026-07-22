import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, m, LazyMotion } from "motion/react";
import { useState, useRef, useLayoutEffect, type JSX } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

type TabsListNode = Array<{
	name: string;
	value: string;
	icon: JSX.Element;
}>;

const INACTIVE_W = 50;
const GAP = 16;
const PADDING = 0;

export default function ExpandableTabs({ tabs }: { tabs: TabsListNode }) {
	const location = useLocation();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [activeWidth, setActiveWidth] = useState(120);
	const listRef = useRef<HTMLDivElement>(null);

	const activeTab =
		searchParams.get("tab") === "history"
			? "history"
			: location.pathname === "/feed"
				? "feed"
				: location.pathname.startsWith("/clusters")
					? "topics"
					: "feed";

	useLayoutEffect(() => {
		if (!listRef.current) {
			return;
		}
		const node = listRef.current;

		const calculate = () => {
			const rect = node.getBoundingClientRect();
			document.documentElement.style.setProperty("--tabs-height", `${rect.height}px`);

			const total = rect.width - PADDING;
			const inactiveTotal = (tabs.length - 1) * INACTIVE_W + (tabs.length - 1) * GAP;
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
		<div className="w-full">
			<Tabs
				value={activeTab}
				onValueChange={(v) => {
					if (v === "history") navigate("/feed?tab=history");
					else if (v === "feed") navigate("/feed");
					else navigate("/clusters");
				}}
				className="gap-4"
			>
				<LazyMotion features={() => import("motion/react").then((mod) => mod.domAnimation)} strict>
					<TabsList
						ref={listRef}
						className="bg-background before:from-background fixed top-[var(--header-height)] left-0 z-50 flex h-auto w-full justify-between rounded-none px-4 before:pointer-events-none before:absolute before:inset-x-0 before:top-full before:h-6 before:bg-gradient-to-b before:from-30% before:to-transparent before:content-['']"
					>
						{tabs.map(({ icon, name, value }) => {
							const isActive = activeTab === value;

							return (
								<m.div
									key={value}
									className="shrink-0 overflow-hidden"
									initial={false}
									animate={{ width: isActive ? activeWidth : INACTIVE_W }}
									transition={{ type: "spring", stiffness: 400, damping: 30 }}
								>
									<TabsTrigger
										value={value}
										className="border-input flex h-12 w-full items-center justify-center gap-1.5 border px-2 data-[state=active]:shadow-none"
									>
										{icon}
										<AnimatePresence initial={false}>
											{isActive && (
												<m.span
													className="overflow-hidden text-sm font-medium whitespace-nowrap"
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0, width: 0 }}
													transition={{ duration: 0.2, ease: "easeOut" }}
												>
													{name}
												</m.span>
											)}
										</AnimatePresence>
									</TabsTrigger>
								</m.div>
							);
						})}
					</TabsList>
				</LazyMotion>
			</Tabs>
		</div>
	);
}

import { Skeleton } from "@/components/ui/skeleton";

export function DesktopLayoutSkeleton() {
	return (
		<main className="bg-background min-h-screen">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-0 lg:px-12">
				<div className="grid grid-cols-3">
					{/* Clusters panel */}
					<aside className="border-border border-x p-4">
						<div className="space-y-5">
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={i} className="h-44 w-full rounded-lg" />
							))}
						</div>
					</aside>

					{/* Main content */}
					<main className="border-border overflow-y-auto border-r p-4">
						<div className="space-y-5">
							<Skeleton className="h-34 w-full rounded-lg" />
							<Skeleton className="h-34 w-full rounded-lg" />
							<Skeleton className="h-34 w-full rounded-lg" />
						</div>
					</main>

					{/* History panel */}
					<aside className="h-[calc(100vh_-_8rem)] space-y-3 border-r p-4">
						<Skeleton className="h-8 w-24 rounded-md" />
						<div className="space-y-5">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-20 w-full rounded-lg" />
							))}
						</div>
					</aside>
				</div>
			</div>
		</main>
	);
}

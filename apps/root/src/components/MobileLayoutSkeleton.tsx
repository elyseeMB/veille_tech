import { Skeleton } from "@/components/ui/skeleton";

export function MobileLayoutSkeleton() {
  return (
    <main className="min-h-screen bg-background">
      {/* Calendar header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background backdrop-blur-md">
        <div className="mx-auto max-w-5xl lg:px-12 pt-3 lg:pt-4 pb-0 lg:pb-2 px-4">
          <Skeleton className="h-65 w-full rounded-lg" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-76">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-5">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>

        {/* Feed / Outlet content */}
        <div className="space-y-5">
          {/* Card */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 -mx-4 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-11/12 rounded-md" />
                <Skeleton className="h-4 w-8/12 rounded-md" />
              </div>

              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

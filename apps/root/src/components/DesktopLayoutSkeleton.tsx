import { Skeleton } from "@/components/ui/skeleton";

export function DesktopLayoutSkeleton() {
  return (
    <main className="min-h-screen bg-background">
      {/* Calendar header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="mx-auto max-w-5xl lg:px-12 pt-3 lg:pt-4 pb-0 lg:pb-2">
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-0 sm:px-6 lg:px-12 pt-32">
        {/* Banner */}
        <Skeleton className="h-16 w-full rounded-xl mb-4" />

        <div className="grid grid-cols-3">
          {/* Clusters panel */}
          <aside className="border-r border-border h-[calc(100vh_-_8rem)] p-4 space-y-3">
            <Skeleton className="h-8 w-32 rounded-md" />

            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </aside>

          {/* Main content */}
          <main className="border-r border-border h-[calc(100vh_-_8rem)] p-6 overflow-y-auto">
            <div className="space-y-5">
              <Skeleton className="h-10 w-2/3 rounded-lg" />
              <Skeleton className="h-5 w-full rounded-md" />
              <Skeleton className="h-5 w-5/6 rounded-md" />
              <Skeleton className="h-5 w-4/6 rounded-md" />

              <Skeleton className="h-64 w-full rounded-2xl" />

              <div className="space-y-3">
                <Skeleton className="h-5 w-full rounded-md" />
                <Skeleton className="h-5 w-11/12 rounded-md" />
                <Skeleton className="h-5 w-9/12 rounded-md" />
              </div>
            </div>
          </main>

          {/* History panel */}
          <aside className="h-[calc(100vh_-_8rem)] p-4 space-y-3">
            <Skeleton className="h-8 w-24 rounded-md" />

            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </aside>
        </div>
      </div>

      {/* Floating actions */}
      <div className="fixed top-4 left-4 flex flex-col gap-2">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </main>
  );
}

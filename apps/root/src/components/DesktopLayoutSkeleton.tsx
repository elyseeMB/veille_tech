import { Skeleton } from "@/components/ui/skeleton";

export function DesktopLayoutSkeleton() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 md:px-0 sm:px-6 lg:px-12">
        <div className="grid grid-cols-3">
          {/* Clusters panel */}
          <aside className="border-x border-border p-4">
            <div className="space-y-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-lg" />
              ))}
            </div>
          </aside>

          {/* Main content */}
          <main className="border-r border-border p-4 overflow-y-auto">
            <div className="space-y-5">
              <Skeleton className="h-34 w-full rounded-lg" />
              <Skeleton className="h-34 w-full rounded-lg" />
              <Skeleton className="h-34 w-full rounded-lg" />
            </div>
          </main>

          {/* History panel */}
          <aside className="h-[calc(100vh_-_8rem)] border-r p-4 space-y-3">
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

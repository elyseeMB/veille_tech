import * as d3 from "d3";

const AMBER_PALETTE = ["#fcd34d", "#f59e0b", "#d97706", "#b45309", "#451a03"];

type ClusterBarItem = {
  name: string;
  count: number;
};

export function ClusterBar({ items }: { items: ClusterBarItem[] }) {
  const total = items.reduce((s, i) => s + i.count, 0);
  if (!total) return null;

  const sorted = [...items].sort((a, b) => b.count - a.count);
  const colorScale = d3
    .scaleThreshold<number, string>()
    .domain([1, 4, 8, 15])
    .range(AMBER_PALETTE);
  const colorMap = new Map<string, string>();
  for (const item of sorted) {
    colorMap.set(item.name, colorScale(item.count));
  }

  return (
    <div className="space-y-1">
      <div className="flex h-6 overflow-hidden rounded-full">
        {sorted.map((seg) => {
          const hasLabel = seg.count / total >= 0.08;
          const div = (
            <div
              key={seg.name}
              className="flex items-center justify-start px-2 text-xs text-white font-medium"
              style={{
                width: `${(seg.count / total) * 100}%`,
                backgroundColor: colorMap.get(seg.name),
              }}
            >
              <div className="flex items-center gap-1">
                <span className="max-w-[60px] truncate">
                  {hasLabel && seg.name}
                </span>
                <span>
                  {hasLabel && `${Math.round((seg.count / total) * 100)}%`}
                </span>
              </div>
            </div>
          );
          return div;
        })}
      </div>
    </div>
  );
}

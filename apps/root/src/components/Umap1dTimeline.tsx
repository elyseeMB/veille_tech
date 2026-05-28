import { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import type { Umap1dData } from "@/types";

const AMBER_PALETTE = ["#fcd34d", "#f59e0b", "#d97706", "#b45309", "#451a03"];
const W = 928;
const H = 600;
const MT = 25;
const MR = 20;
const MB = 50;
const ML = 130;

export function Umap1dTimeline({ data }: { data: Umap1dData }) {
  const axisRef = useRef<SVGGElement>(null);

  const computed = useMemo(() => {
    if (!data?.articles?.length) return null;

    const parseDate = d3.isoParse;
    const articles = data.articles.map((a) => ({
      ...a,
      date: parseDate(a.pubDate)!,
    }));

    const clusterAvgDate = d3.rollup(
      articles,
      (v) => d3.mean(v, (d) => +d.date) ?? 0,
      (d) => d.clusterName,
    );
    const clusterNames = [...clusterAvgDate.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([name]) => name);

    const x = d3
      .scaleTime()
      .domain(d3.extent(articles, (d) => d.date) as [Date, Date])
      .nice()
      .range([ML, W - MR]);

    const y = d3
      .scalePoint()
      .domain(clusterNames)
      .range([H - MB, MT])
      .padding(0.5);

    const clusterCounts = d3.rollup(
      articles,
      (v) => v.length,
      (d) => d.clusterName,
    );
    const colorScale = d3
      .scaleThreshold<number, string>()
      .domain([1, 4, 8, 15])
      .range(AMBER_PALETTE);
    const nameColorMap = new Map<string, string>();
    for (const [name, count] of clusterCounts) {
      nameColorMap.set(name, colorScale(count));
    }

    const leaderName = d3.greatest(
      [...clusterCounts.entries()],
      ([, a]) => a,
    )?.[0];

    const clusterDateKey = (a: (typeof articles)[0]) =>
      `${a.clusterName}|${a.date.getTime()}`;
    const groupCounts = d3.rollup(
      articles,
      (v) => v.length,
      (d) => clusterDateKey(d),
    );
    const groupIndices = new Map<string, number>();
    for (const a of articles) {
      const key = clusterDateKey(a);
      const idx = groupIndices.get(key) ?? 0;
      groupIndices.set(key, idx + 1);
    }

    const items = articles.map((a) => {
      const key = clusterDateKey(a);
      const idx = groupIndices.get(key) ?? 0;
      const total = groupCounts.get(key) ?? 1;
      const step = 10;
      const yBase = y(a.clusterName) ?? 0;
      const offset = (-step * (total - 1)) / 2 + (idx - 1) * step;
      return {
        id: a.id,
        title: a.title,
        link: a.link,
        date: a.date,
        clusterName: a.clusterName,
        cx: x(a.date),
        cy: yBase + offset,
        color: nameColorMap.get(a.clusterName) ?? AMBER_PALETTE[4],
        isLeader: a.clusterName === leaderName,
      };
    });

    return { x, y, clusterNames, items };
  }, [data]);

  useEffect(() => {
    if (!axisRef.current || !computed) return;
    const g = d3.select(axisRef.current);
    g.selectAll("*").remove();
    g.call(
      d3
        .axisBottom(computed.x)
        .ticks(W / 80)
        .tickFormat(d3.timeFormat("%a %-d")),
    ).call((g) => g.select(".domain").remove());
  }, [computed]);

  if (!computed) {
    return (
      <div className="text-muted-foreground p-8 text-center">
        Aucune disponible.
      </div>
    );
  }

  const { x, y, clusterNames, items } = computed;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ maxWidth: "100%", height: "auto", font: "10px sans-serif" }}
    >
      <g stroke="currentColor" strokeOpacity={0.1}>
        {x.ticks(W / 80).map((t, i) => (
          <line
            key={`v${i}`}
            x1={0.5 + x(t)}
            x2={0.5 + x(t)}
            y1={MT}
            y2={H - MB}
          />
        ))}
        {clusterNames.map((n) => (
          <line
            key={`h${n}`}
            y1={0.5 + (y(n) ?? 0)}
            y2={0.5 + (y(n) ?? 0)}
            x1={ML}
            x2={W - MR}
          />
        ))}
      </g>

      <g transform={`translate(${ML},0)`} fill="currentColor" fontWeight="500">
        {clusterNames.map((n) => (
          <text key={n} y={y(n) ?? 0} x={-6} dy="0.35em" textAnchor="end">
            {n}
          </text>
        ))}
      </g>

      <g ref={axisRef} transform={`translate(0,${H - MB})`} />

      {items.map((item) => (
        <a key={item.id} href={item.link} target="_blank">
          <circle
            cx={item.cx}
            cy={item.cy}
            r={3}
            fill={item.color}
            stroke={item.isLeader ? "#78350f" : "currentColor"}
            strokeWidth={item.isLeader ? 1 : 0.5}
            strokeOpacity={item.isLeader ? 1 : 0.15}
          >
            <title>
              {item.title} — {item.clusterName} —{" "}
              {item.date.toLocaleDateString("fr-FR")}
            </title>
          </circle>
        </a>
      ))}
    </svg>
  );
}

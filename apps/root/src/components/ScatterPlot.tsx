import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { ScatterData } from "@/types";

const AMBER_PALETTE = ["#fcd34d", "#f59e0b", "#d97706", "#b45309", "#451a03"];

export function ScatterPlot({ data }: { data: ScatterData }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !data) return;

    const container = ref.current;
    d3.select(container).select("svg").remove();

    const maxVolume = d3.max(data.clusters, (d) => d.volume) ?? 1;

    const width = 928;
    const height = 600;
    const marginTop = 25;
    const marginRight = 20;
    const marginBottom = 50;
    const marginLeft = 110;

    const x = d3.scaleLinear()
      .domain([0, maxVolume * 1.15]).nice()
      .range([marginLeft, width - marginRight]);

    const y = d3.scalePoint()
      .domain(data.periods)
      .range([height - marginBottom, marginTop])
      .padding(0.5);

    const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(width / 80))
      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
        .attr("x", width - marginRight)
        .attr("y", marginBottom - 4)
        .attr("fill", "currentColor")
        .attr("text-anchor", "end")
        .text("Volume d\u2019articles \u2192"));

    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick text")
        .attr("fill", "currentColor")
        .attr("font-weight", "500"));

    svg.append("g")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1)
      .call(g => g.append("g")
        .selectAll("line")
        .data(x.ticks())
        .join("line")
          .attr("x1", d => 0.5 + x(d))
          .attr("x2", d => 0.5 + x(d))
          .attr("y1", marginTop)
          .attr("y2", height - marginBottom))
      .call(g => g.append("g")
        .selectAll("line")
        .data(y.domain())
        .join("line")
          .attr("y1", d => 0.5 + (y(d) ?? 0))
          .attr("y2", d => 0.5 + (y(d) ?? 0))
          .attr("x1", marginLeft)
          .attr("x2", width - marginRight));

    const nameTotals = d3.rollup(
      data.clusters,
      (v) => d3.sum(v, (d) => d.volume),
      (d) => d.name,
    );
    const colorScale = d3.scaleThreshold<number, string>()
      .domain([1, 4, 8, 15])
      .range(AMBER_PALETTE);
    const nameColorMap = new Map<string, string>();
    for (const [name, total] of nameTotals) {
      nameColorMap.set(name, colorScale(total));
    }

    const leaderVolume = d3.max(data.clusters, (d) => d.volume) ?? 0;

    const periodGroups = d3.group(data.clusters, d => d.period);
    const yOffsets = new Map<string, number>();
    for (const [, clusters] of periodGroups) {
      const step = 14;
      const total = clusters.length;
      clusters.forEach((c, i) => {
        yOffsets.set(c.id, -step * (total - 1) / 2 + i * step);
      });
    }

    const linkPairs: { from: ScatterData["clusters"][0]; to: ScatterData["clusters"][0] }[] = [];
    const linkDrawn = new Set<string>();
    for (const c of data.clusters) {
      if (!c.link) continue;
      const pairKey = [c.id, c.link].sort().join("|");
      if (linkDrawn.has(pairKey)) continue;
      linkDrawn.add(pairKey);
      const target = data.clusters.find(x => x.id === c.link);
      if (target) linkPairs.push({ from: c, to: target });
    }

    svg.append("g")
      .selectAll("line")
      .data(linkPairs)
      .join("line")
        .attr("x1", d => x(d.from.volume))
        .attr("y1", d => (y(d.from.period) ?? 0) + (yOffsets.get(d.from.id) ?? 0))
        .attr("x2", d => x(d.to.volume))
        .attr("y2", d => (y(d.to.period) ?? 0) + (yOffsets.get(d.to.id) ?? 0))
        .attr("stroke", "#64748b")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.4)
        .attr("stroke-dasharray", "4,3");

    svg.append("g")
      .attr("fill", "none")
      .selectAll("circle")
      .data(data.clusters)
      .join("circle")
        .attr("cx", d => x(d.volume))
        .attr("cy", d => (y(d.period) ?? 0) + (yOffsets.get(d.id) ?? 0))
        .attr("r", d => Math.max(2, Math.min(8, d.volume / 2)))
        .attr("fill", d => nameColorMap.get(d.name) ?? AMBER_PALETTE[4])
        .attr("stroke", d => d.volume === leaderVolume ? "#78350f" : "currentColor")
        .attr("stroke-width", d => d.volume === leaderVolume ? 1.5 : 0.5)
        .attr("stroke-opacity", d => d.volume === leaderVolume ? 1 : 0.15)
        .append("title")
        .text(d => `${d.name}\nVolume : ${d.volume} articles\nPériode : ${d.period}${d.link ? "\n\u2192 Lié à une autre quinzaine" : ""}`);

    svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("fill", "currentColor")
      .selectAll("text")
      .data(data.clusters)
      .join("text")
        .attr("dy", "0.35em")
        .attr("x", d => x(d.volume) + 7)
        .attr("y", d => (y(d.period) ?? 0) + (yOffsets.get(d.id) ?? 0))
        .text(d => d.name.length > 20 ? d.name.slice(0, 20) + "\u2026" : d.name);

    container.append(svg.node()!);
  }, [data]);

  if (!data || !data.clusters.length) {
    return <div className="text-muted-foreground p-8 text-center">Aucune donn\u00e9e de scatterplot disponible.</div>;
  }

  return <div ref={ref} />;
}

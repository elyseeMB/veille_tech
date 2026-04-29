import { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";

const getId = (nodeOrId: any) =>
  typeof nodeOrId === "object" ? nodeOrId.id : nodeOrId;

export function TemporalForceGraph({ feedData = [] }: { feedData: any[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simRef = useRef<d3.Simulation<any, undefined> | null>(null);
  const allNodesRef = useRef<Map<string, any>>(new Map());

  const width = 800;
  const height = 600;

  // --- 1. Préparation des données & Logique d'Embeddings ---
  const { nodes, links } = useMemo(() => {
    if (!feedData || feedData.length === 0) return { nodes: [], links: [] };

    const THEMES = [
      "ai",
      "openai",
      "claude",
      "github",
      "rust",
      "nasa",
      "space",
      "nuclear",
      "malware",
      "security",
      "robot",
      "apple",
      "linux",
    ];

    const parsedNodes = feedData.map((item, i) => {
      const id = item.data?.url || item.id || `node-${i}`;

      if (allNodesRef.current.has(id)) {
        return allNodesRef.current.get(id);
      }

      const title = item.data?.title || "Untitled";
      const content = `${title} ${item.data?.description || ""}`.toLowerCase();
      const nodeEmbeddings = THEMES.filter((theme) => content.includes(theme));

      const newNode = {
        id,
        type: item.type,
        originalData: item,
        embeddings: nodeEmbeddings,
        // On tronque le titre pour le label du graphe
        displayTitle:
          title.length > 25 ? title.substring(0, 25) + "..." : title,
      };

      allNodesRef.current.set(id, newNode);
      return newNode;
    });

    const parsedLinks: any[] = [];
    for (let i = 0; i < parsedNodes.length; i++) {
      for (let j = i + 1; j < parsedNodes.length; j++) {
        const nodeA = parsedNodes[i];
        const nodeB = parsedNodes[j];
        const intersection = nodeA.embeddings.filter((t: string) =>
          nodeB.embeddings.includes(t),
        );

        if (intersection.length >= 1) {
          parsedLinks.push({
            source: nodeA.id,
            target: nodeB.id,
            strength: intersection.length,
          });
        }
      }
    }

    return { nodes: parsedNodes, links: parsedLinks };
  }, [feedData]);

  // --- 2. Initialisation de la Simulation ---
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [-width / 2, -height / 2, width, height]);

    if (svg.select(".links-group").empty()) {
      svg
        .append("g")
        .attr("class", "links-group")
        .attr("stroke", "#94a3b8")
        .attr("stroke-opacity", 0.3);
      svg.append("g").attr("class", "nodes-group");
    }

    const simulation = d3
      .forceSimulation()
      .force("charge", d3.forceManyBody().strength(-200))
      .force(
        "link",
        d3
          .forceLink()
          .id((d: any) => d.id)
          .distance(100),
      )
      .force("center", d3.forceCenter(0, 0))
      .force("x", d3.forceX(0).strength(0.08))
      .force("y", d3.forceY(0).strength(0.08));

    simulation.on("tick", () => {
      svg
        .selectAll(".link")
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      svg
        .selectAll(".node-group")
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    simRef.current = simulation;
    return () => simulation.stop();
  }, []);

  // --- 3. Logique du Drag ---
  const drag = (simulation: d3.Simulation<any, undefined>) => {
    return d3
      .drag()
      .on("start", (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  };

  // --- 4. Update des éléments ---
  useEffect(() => {
    if (!simRef.current || !svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Update Links
    svg
      .select(".links-group")
      .selectAll("line")
      .data(links, (d: any) => `${getId(d.source)}-${getId(d.target)}`)
      .join("line")
      .attr("class", "link")
      .attr("stroke-width", (d) => Math.sqrt(d.strength || 1) * 1.5);

    // Update Node Groups (Circle + Text)
    const nodeGroups = svg
      .select(".nodes-group")
      .selectAll(".node-group")
      .data(nodes, (d: any) => d.id)
      .join(
        (enter) => {
          const g = enter
            .append("g")
            .attr("class", "node-group")
            .style("cursor", "grab");

          g.append("circle")
            .attr("r", 7)
            .attr("fill", (d: any) =>
              d.type === "video_carousel" ? "#e11d48" : "#2563eb",
            )
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);

          g.append("text")
            .text((d: any) => d.displayTitle)
            .attr("dx", 10)
            .attr("dy", 4)
            .attr("font-size", "9px")
            .attr(
              "class",
              "fill-muted-foreground font-sans pointer-events-none",
            )
            .style("user-select", "none");

          g.call(drag(simRef.current!) as any);
          return g;
        },
        (update) => update,
        (exit) => exit.remove(),
      );

    simRef.current.nodes(nodes as any);
    (simRef.current.force("link") as d3.ForceLink<any, any>).links(links);
    simRef.current.alpha(1).restart();
  }, [nodes, links]);

  return (
    <div className="w-full flex flex-col items-center p-4">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-auto "
      />
    </div>
  );
}

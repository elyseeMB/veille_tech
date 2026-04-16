import { useEffect, useRef } from "react";
import { axisBottom, scaleUtc, timeYear, timeMonth, timeDay, select } from "d3";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip.tsx";

const margin = [10, 20, 40, 40];
const width = 900;
const CELL = 11;
const DAYS_IN_WEEK = 7;
const height = DAYS_IN_WEEK * CELL + margin[0] + margin[2] + 5;
const now = new Date();

const data = timeDay.range(timeYear.floor(now), timeYear.ceil(now));

const x = scaleUtc()
  .domain([timeYear.floor(now), timeYear.ceil(now)])
  .range([margin[3], width - margin[1]]);

const getCx = (d: Date) => {
  const monthStart = timeMonth.floor(d);
  const startDay = (monthStart.getDay() + 6) % 7;
  const weekIndex = Math.floor(
    (timeDay.count(monthStart, d) + startDay) / DAYS_IN_WEEK,
  );
  return x(monthStart) + weekIndex * CELL;
};

const getCy = (d: Date) =>
  (DAYS_IN_WEEK - 1 - ((d.getDay() + 6) % 7)) * CELL + CELL / 2 + margin[0];

const today = +timeDay.floor(now);

export function Calendar() {
  const refAxis = useRef<SVGGElement | null>(null);

  useEffect(() => {
    if (!refAxis.current) return;
    const axis = axisBottom(x)
      .tickValues(timeMonth.range(timeYear.floor(now), timeYear.ceil(now)))
      .tickFormat((d) => (d as Date).toLocaleString("fr", { month: "short" }));

    select(refAxis.current)
      .call(axis)
      .call((d) => d.select(".domain").attr("stroke", "none"))
      .call((d) => d.selectAll(".tick line").attr("stroke", "none"))
      .selectAll(".tick text")
      .attr("dx", CELL)
      .attr("fill", "currentColor")
      .attr("class", "text-muted-foreground text-[10px]");
  }, []);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ display: "block" }}
      className="text-foreground dark:text-white"
    >
      {data.map((d) => {
        const isToday = +d === today;
        const label = d.toLocaleDateString("fr", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });

        return (
          <Tooltip key={+d}>
            <TooltipTrigger render={<g style={{ cursor: "pointer" }} />}>
              {isToday ? (
                <a href={`/date/${d.toISOString().slice(0, 10)}`}>
                  <rect
                    width={CELL - 2}
                    height={CELL - 2}
                    x={getCx(d) - (CELL - 2) / 2}
                    y={getCy(d) - (CELL - 2) / 2}
                    fill="#5dff6d"
                    className="dark:fill-emerald-400"
                  />
                </a>
              ) : (
                <a href={`/date/${d.toISOString().slice(0, 10)}`}>
                  <circle
                    r={CELL / 2 - 1}
                    fill="currentColor"
                    opacity={+d < today ? 0.2 : 0.8}
                    cx={getCx(d)}
                    cy={getCy(d)}
                  />
                </a>
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-serif text-sm">{label}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}

      <g
        ref={refAxis}
        className="text-[10px] font-serif text-muted-foreground dark:text-muted-foreground"
        transform={`translate(0, ${height - margin[2]})`}
      />
    </svg>
  );
}

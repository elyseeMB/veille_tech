import { useEffect, useRef } from "react";
import { axisBottom, scaleUtc, timeYear, timeMonth, timeDay, select } from "d3";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip.tsx";

const DAYS_IN_WEEK = 7;
const now = new Date();
const today = +timeDay.floor(now);

// ── Desktop (année complète)
const D_MARGIN = [10, 20, 40, 40];
const D_CELL = 11;
const D_W = 900;
const D_H = DAYS_IN_WEEK * D_CELL + D_MARGIN[0] + D_MARGIN[2] + 5;

const desktopMonths = timeMonth.range(timeYear.floor(now), timeYear.ceil(now));

const xFull = scaleUtc()
  .domain([timeYear.floor(now), timeYear.ceil(now)])
  .range([D_MARGIN[3], D_W - D_MARGIN[1]]);

const getDCx = (d: Date) => {
  const ms = timeMonth.floor(d);
  const startDay = (ms.getDay() + 6) % 7;
  const weekIdx = Math.floor((timeDay.count(ms, d) + startDay) / DAYS_IN_WEEK);
  return xFull(ms) + weekIdx * D_CELL;
};
const getDCy = (d: Date) =>
  (DAYS_IN_WEEK - 1 - ((d.getDay() + 6) % 7)) * D_CELL +
  D_CELL / 2 +
  D_MARGIN[0];

// ── Mobile (trimestres)
const QC = 14;
const QM = { t: 8, r: 8, b: 30, l: 8 };
const Q_H = DAYS_IN_WEEK * QC + QM.t + QM.b;

const QUARTERS = [0, 1, 2, 3].map((q) => ({
  start: new Date(now.getFullYear(), q * 3, 1),
  end: new Date(now.getFullYear(), q * 3 + 3, 1),
}));

function weeksInMonth(m: Date): number {
  const startDay = (m.getDay() + 6) % 7;
  const days = timeDay.count(m, timeMonth.offset(m, 1));
  return Math.ceil((days + startDay) / DAYS_IN_WEEK);
}

function QuarterCalendar({ start, end }: { start: Date; end: Date }) {
  const axisRef = useRef<SVGGElement | null>(null);
  const months = timeMonth.range(start, end);

  const monthXMap = new Map<number, number>();
  let xOff = QM.l;
  for (const m of months) {
    monthXMap.set(+m, xOff);
    xOff += weeksInMonth(m) * QC;
  }
  const svgW = xOff + QM.r;

  const getCx = (d: Date) => {
    const ms = timeMonth.floor(d);
    const startDay = (ms.getDay() + 6) % 7;
    const weekIdx = Math.floor(
      (timeDay.count(ms, d) + startDay) / DAYS_IN_WEEK,
    );
    return (monthXMap.get(+ms) ?? 0) + weekIdx * QC + QC / 2;
  };
  const getCy = (d: Date) =>
    (DAYS_IN_WEEK - 1 - ((d.getDay() + 6) % 7)) * QC + QC / 2 + QM.t;

  useEffect(() => {
    if (!axisRef.current) return;
    const g = select(axisRef.current);
    g.selectAll("*").remove();
    months.forEach((m) => {
      const cx = (monthXMap.get(+m) ?? 0) + (weeksInMonth(m) * QC) / 2;
      g.append("text")
        .attr("x", cx)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("fill", "currentColor")
        .style("font-size", "10px")
        .style("letter-spacing", "0.2em")
        .style("text-transform", "uppercase")
        .text(m.toLocaleString("fr", { month: "short" }));
    });
  }, [monthXMap, months]);

  return (
    <svg
      viewBox={`0 0 ${svgW} ${Q_H}`}
      width="100%"
      style={{ display: "block" }}
      className="text-foreground dark:text-white"
    >
      {months.map((m) => (
        <g key={+m} className="month-group">
          {timeDay.range(m, timeMonth.offset(m, 1)).map((d) => {
            const isToday = +d === today;
            const isPast = +d < today;
            const cx = getCx(d);
            const cy = getCy(d);
            const dateStr = d.toISOString().slice(0, 10);
            const label = d.toLocaleDateString("fr", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });

            return (
              <Tooltip key={+d}>
                <TooltipTrigger
                  render={
                    <g
                      style={{
                        cursor: isPast || isToday ? "pointer" : "default",
                      }}
                    />
                  }
                >
                  {isToday ? (
                    <a href={`/date/${dateStr}`}>
                      <rect
                        width={QC - 2}
                        height={QC - 2}
                        x={cx - (QC - 2) / 2}
                        y={cy - (QC - 2) / 2}
                        fill="#5dff6d"
                        className="dark:fill-emerald-400"
                      />
                    </a>
                  ) : isPast ? (
                    <a href={`/date/${dateStr}`}>
                      <circle
                        r={QC / 2 - 1.5}
                        fill="currentColor"
                        opacity={0.2}
                        cx={cx}
                        cy={cy}
                      />
                    </a>
                  ) : (
                    <circle
                      r={QC / 2 - 1.5}
                      fill="currentColor"
                      opacity={0.75}
                      cx={cx}
                      cy={cy}
                    />
                  )}
                </TooltipTrigger>
                <TooltipContent className="pointer-events-none">
                  <p className="font-serif text-sm">{label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </g>
      ))}
      <g
        ref={axisRef}
        className="text-muted-foreground"
        transform={`translate(0, ${Q_H - QM.b + 12})`}
      />
    </svg>
  );
}

export function Calendar({ scrollable = false }: { scrollable?: boolean }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const axisRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    if (scrollable || !axisRef.current) {
      return;
    }
    const axis = axisBottom(xFull)
      .tickValues(desktopMonths)
      .tickFormat((d) => (d as Date).toLocaleString("fr", { month: "short" }));

    select(axisRef.current)
      .call(axis)
      .call((g) => g.select(".domain").attr("stroke", "none"))
      .call((g) => g.selectAll(".tick line").attr("stroke", "none"))
      .selectAll(".tick text")
      .attr("x", (d: Date) => {
        const start = getDCx(d);
        const end = getDCx(timeDay.offset(timeMonth.offset(d, 1), -1));
        return (end - start) / 2;
      })
      .attr("fill", "currentColor")
      .attr("class", "text-muted-foreground text-[10px]");
  }, [scrollable]);

  useEffect(() => {
    if (!scrollable || !scrollRef.current) {
      return;
    }
    const currentQ = Math.floor(now.getMonth() / 3);
    (scrollRef.current.children[currentQ] as HTMLElement)?.scrollIntoView({
      behavior: "instant",
      inline: "start",
      block: "nearest",
    });
  }, [scrollable]);

  if (scrollable) {
    return (
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {QUARTERS.map((q, i) => (
          <div key={i} className="snap-start shrink-0 w-full px-4">
            <QuarterCalendar start={q.start} end={q.end} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${D_W} ${D_H}`}
      width="100%"
      style={{ display: "block" }}
      className="text-foreground dark:text-white"
    >
      {desktopMonths.map((m) => (
        <g key={+m} className="month-group">
          {timeDay.range(m, timeMonth.offset(m, 1)).map((d) => {
            const isToday = +d === today;
            const isPast = +d < today;
            const label = d.toLocaleDateString("fr", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            return (
              <Tooltip key={+d}>
                <TooltipTrigger
                  render={
                    <g
                      style={{
                        cursor: isPast || isToday ? "pointer" : "default",
                      }}
                    />
                  }
                >
                  {isToday ? (
                    <a href={`/date/${d.toISOString().slice(0, 10)}`}>
                      <rect
                        width={D_CELL - 2}
                        height={D_CELL - 2}
                        x={getDCx(d) - (D_CELL - 2) / 2}
                        y={getDCy(d) - (D_CELL - 2) / 2}
                        fill="#5dff6d"
                        className="dark:fill-emerald-400"
                      />
                    </a>
                  ) : isPast ? (
                    <a href={`/date/${d.toISOString().slice(0, 10)}`}>
                      <circle
                        r={D_CELL / 2 - 1}
                        fill="currentColor"
                        opacity={0.2}
                        cx={getDCx(d)}
                        cy={getDCy(d)}
                      />
                    </a>
                  ) : (
                    <circle
                      className="cursor-default"
                      r={D_CELL / 2 - 1}
                      fill="currentColor"
                      opacity={0.8}
                      cx={getDCx(d)}
                      cy={getDCy(d)}
                    />
                  )}
                </TooltipTrigger>
                <TooltipContent className="pointer-events-none">
                  <p className="font-serif text-sm">{label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </g>
      ))}
      <g
        ref={axisRef}
        className="text-sm font-serif text-muted-foreground dark:text-muted-foreground"
        transform={`translate(0, ${D_H - D_MARGIN[2]})`}
      />
    </svg>
  );
}

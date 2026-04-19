import { timeMinute, timeHour, timeDay, timeMonth, timeYear } from "d3";

const rtf = new Intl.RelativeTimeFormat(navigator.language, {
  numeric: "auto",
});

function getRelativeTime(date: Date): string {
  const now = new Date();

  const minutes = timeMinute.count(date, now);
  if (minutes < 60) return rtf.format(-minutes, "minute");

  const hours = timeHour.count(date, now);
  if (hours < 24) return rtf.format(-hours, "hour");

  const days = timeDay.count(date, now);
  if (days < 30) return rtf.format(-days, "day");

  const months = timeMonth.count(date, now);
  if (months < 12) return rtf.format(-months, "month");

  return rtf.format(-timeYear.count(date, now), "year");
}

export function TimeRelative({
  date,
  className,
}: {
  date: string | Date;
  className?: string;
}) {
  const d = typeof date === "string" ? new Date(date) : date;

  return (
    <time
      dateTime={d.toISOString()}
      title={d.toLocaleDateString("en", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
      className={["text-sm", className].join(" ")}
    >
      {getRelativeTime(d)}
    </time>
  );
}

import { timeMinute, timeHour, timeDay, timeMonth, timeYear } from "d3";

function getRelativeTime(date: Date): string {
  const now = new Date();

  const minutes = timeMinute.count(date, now);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = timeHour.count(date, now);
  if (hours < 24) return `${hours}h ago`;

  const days = timeDay.count(date, now);
  if (days < 30) return `${days}d ago`;

  const months = timeMonth.count(date, now);
  if (months < 12) return `${months}mo ago`;

  return `${timeYear.count(date, now)}y ago`;
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

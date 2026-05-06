import { useEffect, useState } from "react";

type CalendarData = Record<string, { count: string }>;

const url = import.meta.env.PROD
  ? "https://api.veille.safecoffi.app/v1/calendar"
  : "http://localhost:8081/v1/calendar";

export function useCalendarData(): CalendarData {
  const [data, setData] = useState<CalendarData>({});

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      });
    return () => controller.abort();
  }, []);

  return data;
}

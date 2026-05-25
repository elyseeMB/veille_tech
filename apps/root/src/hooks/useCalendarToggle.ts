import { useState, useEffect } from "react";

export function useCalendarToggle(initial = true) {
  const [visible, setVisible] = useState(() => {
    const stored = localStorage.getItem("calendar-visible");
    return stored !== null ? stored === "true" : initial;
  });

  useEffect(() => {
    localStorage.setItem("calendar-visible", String(visible));
  }, [visible]);

  function toggle() {
    if (!document.startViewTransition) {
      setVisible((v) => !v);
      return;
    }
    document.startViewTransition(() => setVisible((v) => !v));
  }

  return { visible, toggle };
}
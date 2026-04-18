import { useState } from "react";

export function useCalendarToggle(initial = true) {
  const [visible, setVisible] = useState(initial);

  function toggle() {
    if (!document.startViewTransition) {
      setVisible((v) => !v);
      return;
    }
    document.startViewTransition(() => setVisible((v) => !v));
  }

  return { visible, toggle };
}
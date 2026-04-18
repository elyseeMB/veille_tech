import { useLayoutEffect, useRef, useState } from "react";

export function useContainerLeftOffset(offset = 42) {
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(0);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => setLeft(node.getBoundingClientRect().left - offset);

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [offset]);

  return { ref, left };
}
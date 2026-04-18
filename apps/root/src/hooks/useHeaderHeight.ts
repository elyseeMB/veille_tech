import { useLayoutEffect, useRef, useState } from "react";

export function useHeaderHeight() {
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(80);

  useLayoutEffect(() => {
    const update = () => {
      const desktopH = desktopRef.current?.getBoundingClientRect().height ?? 0;
      const mobileH = mobileRef.current?.getBoundingClientRect().height ?? 0;
      setHeight(desktopH > 0 ? desktopH : mobileH);
    };

    update();
    const observer = new ResizeObserver(update);
    if (desktopRef.current) observer.observe(desktopRef.current);
    if (mobileRef.current) observer.observe(mobileRef.current);
    return () => observer.disconnect();
  }, []);

  return { desktopRef, mobileRef, height };
}
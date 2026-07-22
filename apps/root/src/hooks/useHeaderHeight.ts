import { useLayoutEffect, useRef, useState } from "react";

export function useHeaderHeight() {
	const ref = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(80);

	useLayoutEffect(() => {
		const update = () => {
			setHeight(ref.current?.getBoundingClientRect().height ?? 80);
		};

		update();
		const observer = new ResizeObserver(update);
		if (ref.current) observer.observe(ref.current);
		return () => observer.disconnect();
	}, []);

	return { ref, height };
}

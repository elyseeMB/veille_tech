import { BannerProvider } from "@/components/BannerContext";
import { DesktopLayoutSkeleton } from "@/components/DesktopLayoutSkeleton.tsx";
import { MobileLayoutSkeleton } from "@/components/MobileLayoutSkeleton.tsx";
import { Seo } from "@/components/Seo.tsx";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { lazy, Suspense } from "react";

const MobileLayout = lazy(() => import("./MobileLayout").then((m) => ({ default: m.MobileLayout })));
const DesktopLayout = lazy(() => import("./DesktopLayout").then((m) => ({ default: m.DesktopLayout })));

export function RootLayout() {
	const isMobile = useMediaQuery("(max-width: 768px)");

	return (
		<BannerProvider>
			<Seo title="Feed | Veille Tech" description="Find your latest articles." />
			<Suspense fallback={<RootLayoutSkeleton />}>{isMobile ? <MobileLayout /> : <DesktopLayout />}</Suspense>
		</BannerProvider>
	);
}

export function RootLayoutSkeleton() {
	const isMobile = useMediaQuery("(max-width: 768px)");
	return isMobile ? <MobileLayoutSkeleton /> : <DesktopLayoutSkeleton />;
}

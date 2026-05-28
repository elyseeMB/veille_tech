import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MobileLayout } from "./MobileLayout";
import { DesktopLayout } from "./DesktopLayout";
import { BannerProvider } from "@/components/BannerContext";
import { DesktopLayoutSkeleton } from "@/components/DesktopLayoutSkeleton.tsx";
import { MobileLayoutSkeleton } from "@/components/MobileLayoutSkeleton.tsx";
import { Seo } from "@/components/Seo.tsx";

export function RootLayout() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <BannerProvider>
      <Seo
        title="Feed | Veille Tech"
        description="Find your latest articles."
      />
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </BannerProvider>
  );
}

export function RootLayoutSkeleton() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  return isMobile ? <MobileLayoutSkeleton /> : <DesktopLayoutSkeleton />;
}
